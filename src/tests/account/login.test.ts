import request from "supertest";
import app from "../../app";
import {Role, Task} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser, tooLongSummary} from "..";

describe("User Login", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);
	});

	it("User logs in successfully", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(200);
		expect(loginResult.body.token).not.toBeUndefined();
	});

	it("User does not log in successfully due to an unknown e-mail", async () => {
		const loginResult = await request(app).post("/login").send({email: "unknown@email.com", password: "Test1234#"});
		expect(loginResult.status).toBe(404);
		expect(loginResult.body).toStrictEqual({error: "E-mail was not found!"});
	});

	it("User does not log in successfully due to a wrong password", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com", password: "Test1234"});
		expect(loginResult.status).toBe(403);
		expect(loginResult.body).toStrictEqual({error: "Passwords do not match!"});
	});

	it("User does not log in successfully due to a missing e-mail", async () => {
		const loginResult = await request(app).post("/login").send({password: "Test1234#"});
		expect(loginResult.status).toBe(400);
		expect(loginResult.body).toStrictEqual({error: "Please provide an e-mail address!"});
	});

	it("User does not log in successfully due to a missing password", async () => {
		const loginResult = await request(app).post("/login").send({email: "manager@email.com"});
		expect(loginResult.status).toBe(400);
		expect(loginResult.body).toStrictEqual({error: "Please provide a password!"});
	});
});
