import request from "supertest";
import app from "../../app";
import {Role, Task} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser, tooLongSummary} from "..";

const currentDate = "2024-06-13T10:32:06.605Z";

describe("Create Tasks", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);

		jest.spyOn(prisma.task, "create").mockImplementation((async ({data}: {data: {summary: string; userId: number}}) => {
			const task = {
				id: 3,
				createdAt: currentDate,
				updatedAt: currentDate,
				summary: data.summary,
				userId: data.userId,
			};

			return task;
		}) as any);
	});

	it("Created the technician's task successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).post("/tasks").auth(token, {type: "bearer"}).send({summary: "This is a summary"});

		const expected = {
			id: 3,
			createdAt: currentDate,
			updatedAt: currentDate,
			summary: "This is a summary",
			userId: 1,
		};

		expect(taskCreateResult.status).toBe(200);
		expect(taskCreateResult.body).toStrictEqual(expected);
	});

	it("Fails at creating the technician's task due to not having a summary", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).post("/tasks").auth(token, {type: "bearer"}).send();

		expect(taskCreateResult.status).toBe(400);
		expect(taskCreateResult.body).toStrictEqual({error: "Please provide a summary!"});
	});

	it("Fails at creating the technician's task due to the summary being too long", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskCreateResult = await request(app).post("/tasks").auth(token, {type: "bearer"}).send({summary: tooLongSummary});

		expect(taskCreateResult.status).toBe(400);
		expect(taskCreateResult.body).toStrictEqual({error: `Please provide a summary with a maximum of 2500 characters!`});
	});

	it("Fails creating the task due to not being logged in", async () => {
		const taskListResult = await request(app).post("/tasks").send({summary: "This is a summary"});
		expect(taskListResult.status).toBe(401);
	});
});
