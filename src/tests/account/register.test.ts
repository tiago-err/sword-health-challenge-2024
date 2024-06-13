import request from "supertest";
import app from "../../app";
import {Role, Task} from "@prisma/client";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import {managerUser, taskList, technicianUser, tooLongSummary} from "..";

describe("User Register", () => {
	beforeEach(() => {
		jest.spyOn(prisma.user, "findUnique").mockImplementation((async (query: {where: {id?: number; email?: string}}) => {
			if (query.where.email === technicianUser.email || query.where.id === technicianUser.id) return technicianUser;
			if (query.where.email === managerUser.email || query.where.id === managerUser.id) return managerUser;
			return null;
		}) as any);

		jest.spyOn(prisma.user, "create").mockImplementation((async ({data}: {data: {email: string; password: string}}) => {
			if ([technicianUser, managerUser].find((x) => x.email === data.email)) throw "E-mail already in use!";
			return {
				id: 3,
				email: data.email,
				role: Role.TECHNICIAN,
				password: bcrypt.hashSync(data.password, bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS || "10"))),
			};
		}) as any);
	});

	it("User registers successfully", async () => {
		const registerResult = await request(app).post("/register").send({email: "user@email.com", password: "Test1234#"});
		expect(registerResult.status).toBe(200);
		expect(registerResult.body.token).not.toBeUndefined();
	});

	it("User does not register successfully due to an already used e-mail", async () => {
		const registerResult = await request(app).post("/register").send({email: "test@email.com", password: "Test1234#"});
		expect(registerResult.status).toBe(400);
		expect(registerResult.body).toStrictEqual({error: "That e-mail is already in use!"});
	});

	it("User does not register successfully due to an invalid formatted password", async () => {
		const registerResult = await request(app).post("/register").send({email: "user@email.com", password: "Test1234"});
		expect(registerResult.status).toBe(400);
		expect(registerResult.body).toStrictEqual({
			error: "Please provide a valid 8 character password, containing one lowercase letter, one uppercase letter, one number and one special character!",
		});
	});

	it("User does not register successfully due to an invalid formatted e-mail", async () => {
		const registerResult = await request(app).post("/register").send({email: "user.email.com", password: "Test1234"});
		expect(registerResult.status).toBe(400);
		expect(registerResult.body).toStrictEqual({error: "Please provide a valid e-mail address!"});
	});

	it("User does not register successfully due to a missing e-mail", async () => {
		const registerResult = await request(app).post("/register").send({password: "Test1234#"});
		expect(registerResult.status).toBe(400);
		expect(registerResult.body).toStrictEqual({error: "Please provide an e-mail address!"});
	});

	it("User does not register successfully due to a missing password", async () => {
		const registerResult = await request(app).post("/register").send({email: "manager@email.com"});
		expect(registerResult.status).toBe(400);
		expect(registerResult.body).toStrictEqual({error: "Please provide a password!"});
	});
});
