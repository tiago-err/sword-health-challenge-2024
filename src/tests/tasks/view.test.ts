import request from "supertest";
import app from "../../app";
import {Role} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser} from ".";

describe("List Tasks", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);

		jest.spyOn(prisma.task, "findMany").mockImplementation((async (query: {where?: {userId?: number}}) => {
			if (!query.where) return taskList;
			return taskList.filter((x) => x.userId === query.where?.userId);
		}) as any);

		jest.spyOn(prisma.task, "findUnique").mockImplementation((async (query: {where: {id?: number}}) => {
			return taskList.find((x) => x.id === query.where.id);
		}) as any);
	});

	it("Lists the technician's tasks successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(200);
		expect(taskListResult.body).toHaveLength(1);
	});

	it("Shows the technician's task successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks/1").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(200);
		expect(taskListResult.body).toStrictEqual(taskList[0]);
	});

	it("Fails to show a task not performed by the technician", async () => {
		const loginResult = await request(app).post("/login").send({email: "test@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks/2").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(403);
		expect(taskListResult.body).toStrictEqual({error: "You do not have permission to view this task!"});
	});

	it("Lists all the tasks successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(200);
		expect(taskListResult.body).toHaveLength(2);
	});

	it("Shows the technician's task successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks/1").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(200);
		expect(taskListResult.body).toStrictEqual(taskList[0]);
	});

	it("Shows the non-technician's task successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks/2").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(200);
		expect(taskListResult.body).toStrictEqual(taskList[1]);
	});

	it("Fails showing a task due to an unknown ID", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);

		const {token} = loginResult.body;
		const taskListResult = await request(app).get("/tasks/3").auth(token, {type: "bearer"}).send();

		expect(taskListResult.status).toBe(404);
		expect(taskListResult.body).toStrictEqual({error: "Task not found!"});
	});

	it("Fails listing the tasks due to not being logged in", async () => {
		const taskListResult = await request(app).get("/tasks").send();
		expect(taskListResult.status).toBe(401);
	});
});
