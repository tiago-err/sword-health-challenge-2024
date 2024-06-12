import prisma from "../prisma";
import bcrypt from "bcrypt";

export default async function initializeManager() {
	const email = process.env.DEFAULT_MANAGER_EMAIL;
	const password = process.env.DEFAULT_MANAGER_PASSWORD;

	if (!email) return console.error("No default manager e-mail set as an environment variable (DEFAULT_MANAGER_EMAIL)!");
	if (!password) return console.error("No default manager password set as an environment variable (DEFAULT_MANAGER_PASSWORD)!");

	const existingDefaultManager = await prisma.user.findUnique({where: {email}});
	if (!existingDefaultManager) {
		console.log(`Creating default manager with the e-mail ${email}...`);
		await prisma.user.create({
			data: {
				email,
				password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
				role: "MANAGER",
			},
		});
		console.log(`Created default manager with the e-mail ${email}!`);
	} else {
		console.log("Default manager already exists.");
	}
}
