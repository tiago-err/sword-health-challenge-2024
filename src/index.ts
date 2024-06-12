import express, {Express, NextFunction, Request, Response} from "express";
import {expressjwt, Request as ProtectedRequest} from "express-jwt";
import {PrismaClient, Role, Task, User} from "@prisma/client";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {EMAIL_REGEX, PASSWORD_REGEX} from "./constants/regex";
import prisma from "./prisma";
import {taskRouter} from "./routes";
import initializeManager from "./utils/initializeManager";
import {createMessageReceiver} from "./utils/messageQueue";
import moment from "moment";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/tasks", taskRouter);

app.post("/login", async (req: Request, res: Response) => {
	const {email, password} = req.body as {email: string; password: string};

	if (!email) return res.status(400).json({error: "Please provide an e-mail address!"});
	if (!password) return res.status(400).json({error: "Please provide a password!"});

	try {
		const user = await prisma.user.findUnique({where: {email}});
		if (!user) return res.status(404).json({error: "E-mail was not found!"});
		if (!bcrypt.compareSync(password, user.password)) return res.status(403).json({error: "Passwords do not match!"});

		return res.status(200).json({
			token: jwt.sign({email: user.email, role: user.role, id: user.id}, process.env.JWT_SECRET || "", {algorithm: "HS256"}),
		});
	} catch (error) {
		console.error("Error creating user:", error);
		return res.status(500).json({error});
	}
});

app.post("/register", async (req: Request, res: Response) => {
	const {email, password} = req.body as {email: string; password: string};

	if (!email) return res.status(400).json({error: "Please provide an e-mail address!"});
	if (!password) return res.status(400).json({error: "Please provide a password!"});

	if (!EMAIL_REGEX.test(email)) return res.status(400).json({error: "Please provide a valid e-mail address!"});
	if (!PASSWORD_REGEX.test(password))
		return res.status(400).json({
			error: "Please provide a valid 8 character password, containing one lowercase letter, one uppercase letter, one number and one special character!",
		});

	try {
		const user = await prisma.user.create({
			data: {
				email,
				password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
			},
		});
		return res.status(200).json({
			token: jwt.sign({email: user.email, role: user.role, id: user.id}, process.env.JWT_SECRET || "", {algorithm: "HS256"}),
		});
	} catch (error) {
		console.error("Error creating user:", error);
		return res.status(500).json({error});
	}
});

(async () => {
	await initializeManager();
	await createMessageReceiver("task_queue", (message) => {
		if (!message?.content) return;
		const content = JSON.parse(message.content.toString()) as {user: User; task: Task};

		console.log(
			`[${moment(content.task.createdAt).format("YYYY/MM/DD - HH:mm")}] New task performed by ${content.user.email}:\nTask #${
				content.task.id
			}: ${content.task.summary}`,
		);
	});
	app.listen(port, () => {
		console.log(`[server]: Server is running at http://localhost:${port}`);
	});
})();
