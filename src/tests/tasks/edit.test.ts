import request from "supertest";
import app from "../../app";
import {Role, Task} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser, tooLongSummary} from "..";

const updateDate = "2024-06-14T10:32:06.605Z";

describe("Edit Tasks", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);

		jest.spyOn(prisma.task, "update").mockImplementation((async ({data, where}: {data: {summary: string}; where: {id: number}}) => {
			const task = taskList.find((x) => x.id === where.id);
			if (!task) return null;

			return {...task, updatedAt: updateDate, summary: data.summary};
		}) as any);

		jest.spyOn(prisma.task, "findUnique").mockImplementation((async (query: {where: {id?: number}}) => {
			return taskList.find((x) => x.id === query.where.id);
		}) as any);
	});

	it("Edited the technician's task successfully as a manager", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/1").auth(token, {type: "bearer"}).send({summary: "This is a longer summary"});

		const expected = {
			id: 1,
			createdAt: taskList[0].createdAt,
			updatedAt: updateDate,
			summary: "This is a longer summary",
			userId: 1,
		};

		expect(taskCreateResult.status).toBe(200);
		expect(taskCreateResult.body).toStrictEqual(expected);
	});

	it("Edited the technician's task successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/1").auth(token, {type: "bearer"}).send({summary: "This is a longer summary"});

		const expected = {
			id: 1,
			createdAt: taskList[0].createdAt,
			updatedAt: updateDate,
			summary: "This is a longer summary",
			userId: 1,
		};

		expect(taskCreateResult.status).toBe(200);
		expect(taskCreateResult.body).toStrictEqual(expected);
	});

	it("Fails at editing the technician's task due to not having a summary", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/1").auth(token, {type: "bearer"}).send();

		expect(taskCreateResult.status).toBe(400);
		expect(taskCreateResult.body).toStrictEqual({error: "Please provide a summary!"});
	});

	it("Fails at editing the technician's task due to an unknown ID", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/3").auth(token, {type: "bearer"}).send({summary: "This is a longer summary"});

		expect(taskCreateResult.status).toBe(404);
		expect(taskCreateResult.body).toStrictEqual({error: "Task not found!"});
	});

	it("Fails at editing the technician's task due to the summary being too long", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/1").auth(token, {type: "bearer"}).send({summary: tooLongSummary});

		expect(taskCreateResult.status).toBe(400);
		expect(taskCreateResult.body).toStrictEqual({error: `Please provide a summary with a maximum of 2500 characters!`});
	});

	it("Fails at editing the technician's task due to not belonging to them", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).put("/tasks/2").auth(token, {type: "bearer"}).send({summary: "This is a longer summary"});

		expect(taskCreateResult.status).toBe(403);
		expect(taskCreateResult.body).toStrictEqual({error: `You do not have permission to edit this task!`});
	});

	it("Fails editing the task due to not being logged in", async () => {
		const taskListResult = await request(app).put("/tasks/1").send({summary: "This is a summary"});
		expect(taskListResult.status).toBe(401);
	});
});
