import express, {Express, NextFunction, Request, Response} from "express";
import {expressjwt, Request as ProtectedRequest} from "express-jwt";
import prisma from "../prisma";
import {jwtMiddleware, isAuthenticated} from "../middlewares/authentication";
import {Role, User} from "@prisma/client";
import {sendMessage} from "../utils/messageQueue";

const router = express.Router();

const MAX_SUMMARY = 2500;

router.get("/", jwtMiddleware, isAuthenticated, async (req: ProtectedRequest, res: Response) => {
	const user = req.auth! as User;

	const query = user.role === Role.MANAGER ? prisma.task.findMany({}) : prisma.task.findMany({where: {userId: user.id}});
	try {
		const tasks = await query;
		return res.status(200).json(tasks);
	} catch (error) {
		return res.status(500).json({error});
	}
});

router.get("/:id", jwtMiddleware, isAuthenticated, async (req: ProtectedRequest, res: Response) => {
	const user = req.auth! as User;
	const taskID = req.params.id;

	try {
		const task = await prisma.task.findUnique({where: {id: parseInt(taskID)}});
		if (!task) return res.status(404).json({error: "Task not found!"});
		if (user.role === Role.TECHNICIAN && task.userId !== user.id)
			return res.status(403).json({error: "You do not have permission to view this task!"});

		return res.status(200).json(task);
	} catch (error) {
		return res.status(400).json({error: "Please provide a valid ID!"});
	}
});

router.delete("/:id", jwtMiddleware, isAuthenticated, async (req: ProtectedRequest, res: Response) => {
	const user = req.auth! as User;
	const taskID = req.params.id;

	try {
		const task = await prisma.task.findUnique({where: {id: parseInt(taskID)}});
		if (!task) return res.status(404).json({error: "Task not found!"});
		if (user.role === Role.TECHNICIAN) return res.status(403).json({error: "You do not have permission to delete this task!"});

		const deletedTask = await prisma.task.delete({where: {id: parseInt(taskID)}});
		return res.status(200).json(deletedTask);
	} catch (error) {
		return res.status(400).json({error: "Please provide a valid ID!"});
	}
});

router.put("/:id", jwtMiddleware, isAuthenticated, async (req: ProtectedRequest, res: Response) => {
	const user = req.auth! as User;
	const taskID = req.params.id;

	try {
		const task = await prisma.task.findUnique({where: {id: parseInt(taskID)}});
		if (!task) return res.status(404).json({error: "Task not found!"});
		if (user.role === Role.TECHNICIAN && task.userId !== user.id)
			return res.status(403).json({error: "You do not have permission to edit this task!"});

		const {summary} = req.body as {summary: string};
		if (!summary) return res.status(400).json({error: "Please provide a summary!"});
		if (summary.length > MAX_SUMMARY)
			return res.status(400).json({error: `Please provide a summary with a maximum of ${MAX_SUMMARY} characters!`});

		try {
			const updatedTask = await prisma.task.update({where: {id: parseInt(taskID)}, data: {summary}});
			return res.status(200).json(updatedTask);
		} catch (error) {
			return res.status(500).json({error});
		}
	} catch (error) {
		return res.status(400).json({error: "Please provide a valid ID!"});
	}
});

router.post("/", jwtMiddleware, isAuthenticated, async (req: ProtectedRequest, res: express.Response) => {
	const user = req.auth! as User;

	const {summary} = req.body as {summary: string};
	if (!summary) return res.status(400).json({error: "Please provide a summary!"});
	if (summary.length > MAX_SUMMARY) return res.status(400).json({error: `Please provide a summary with a maximum of ${MAX_SUMMARY} characters!`});

	try {
		const task = await prisma.task.create({
			data: {
				summary: req.body.summary,
				userId: user.id,
			},
		});

		if (user.role === "TECHNICIAN") {
			await sendMessage("task_queue", JSON.stringify({user, task}));
		}
		return res.status(200).json(task);
	} catch (error) {
		return res.status(500).json({error});
	}
});

export default router;
