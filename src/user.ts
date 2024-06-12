import * as bcrypt from "bcrypt";

const saltRounds = 10;

export interface UserInterface {
	id: number;
	username: string;
	password: string;
}

export class User {
	static async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(saltRounds);
		return await bcrypt.hash(password, salt);
	}

	static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}
}
