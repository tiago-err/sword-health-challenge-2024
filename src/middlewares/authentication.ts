import express, {Express, NextFunction, Request, Response} from "express";
import {expressjwt, Request as ProtectedRequest} from "express-jwt";
import prisma from "../prisma";

export const jwtMiddleware = expressjwt({secret: process.env.JWT_SECRET || "", algorithms: ["HS256"]});
export const isAuthenticated = async (req: ProtectedRequest, res: Response, next: NextFunction) => {
	try {
		if (req.auth) {
			const {id} = req.auth;
			const user = await prisma.user.findUnique({where: {id}});
			if (!user) {
				return res.status(401).json({error: "Unauthorized: User not found"});
			}
		}
		next();
	} catch (error) {
		console.error("Error during JWT verification:", error);
		res.status(401).json({error: "Unauthorized"});
	}
};
