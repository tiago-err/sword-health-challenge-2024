import request from "supertest";
import app from "../../app";
import {Role, Task} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser, tooLongSummary} from "..";

describe("Delete Tasks", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);

		jest.spyOn(prisma.task, "delete").mockImplementation((async ({where}: {where: {id: number}}) => {
			const task = taskList.find((x) => x.id === where.id);
			if (!task) return null;

			return task;
		}) as any);

		jest.spyOn(prisma.task, "findUnique").mockImplementation((async (query: {where: {id?: number}}) => {
			return taskList.find((x) => x.id === query.where.id);
		}) as any);
	});

	it("Deleted the technician's task successfully as a manager", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).delete("/tasks/1").auth(token, {type: "bearer"}).send();

		expect(taskCreateResult.status).toBe(200);
		expect(taskCreateResult.body).toStrictEqual(taskList[0]);
	});

	it("Fails at deleting the technician's task due to an unknown ID", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).delete("/tasks/3").auth(token, {type: "bearer"}).send();

		expect(taskCreateResult.status).toBe(404);
		expect(taskCreateResult.body).toStrictEqual({error: "Task not found!"});
	});

	it("Fails at deleting the technician's task due to not having permission", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).delete("/tasks/1").auth(token, {type: "bearer"}).send();

		expect(taskCreateResult.status).toBe(403);
		expect(taskCreateResult.body).toStrictEqual({error: "You do not have permission to delete this task!"});
	});

	it("Fails deleting the task due to not being logged in", async () => {
		const taskListResult = await request(app).delete("/tasks/1").send();
		expect(taskListResult.status).toBe(401);
	});
});
