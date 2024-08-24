import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from 'hono';
import { sign,verify } from 'hono/jwt'
import {signinInput,signupInput}  from '@dparbadiya/mediumcommon'


export const userRouter = new Hono<
{
    Bindings : {
        DATABASE_URL: string,
		JWT_SECRET: string,
    }
}
>()


userRouter.post('/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
    const {success} = signupInput.safeParse(body)

    if(!success) {
        c.status(411);
        return c.json({ error: "invalid input" });
    }

	try {
		const user = await prisma.user.create({
			data: {
				email: body.username ,
				password: body.password
			}
		});
		const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
		return c.json({ jwt });
	} catch(e) {
		c.status(403);
		return c.json({ error: "error while signing up", error_message : e });
	}
})
userRouter.post('/signin',async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where : {
			email : body.email
		}
	})

	if(user && user.password === body.password) {
		const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
		return c.json({ jwt });
	} else {
		c.status(403);
		return c.json({ error: "error while signing in" });
	}
});