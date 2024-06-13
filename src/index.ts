import {Task, User} from "@prisma/client";
import dotenv from "dotenv";
import initializeManager from "./utils/initializeManager";
import {createMessageReceiver} from "./utils/messageQueue";
import moment from "moment";
import app from "./app";

dotenv.config();
const port = process.env.PORT || 3000;

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
