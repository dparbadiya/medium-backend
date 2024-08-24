import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string;
  };
}>();

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
  
    const blogs = await prisma.blog.findMany();
    return c.json({ blogs });
  });

blogRouter.use('/*', async (c, next) => {
  // get the header
  const header = c.req.header('Authorization') || '';
  const token = header.split(' ')[1];
  // verify the header
  try{

      const user = await verify(token, c.env.JWT_SECRET);
      // if header is correct we can proceed
      if (user) {
          // c.req.id = response.id;
          c.set('userId', user.id);
          await next();
        } else {
            c.status(403);
            return c.json({ error: 'You are not logged in or session expired' });
        }
    }
    catch(error){
      c.status(403);
      return c.json({ error: 'unauthorized' });
    }
});

blogRouter.post('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      description: body.description,
      thumbnail: body?.thumbnail,
      authorId: body.authorId,
    },
  });

  return c.json({
    id: blog.id,
  });
});

blogRouter.put('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const blog = await prisma.blog.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      description: body.description,
      thumbnail: body.thumbnail,
      authorId: body.authorId,
    },
  });

  return c.json({
    id: blog.id,
  });
});

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
  
    const blogs = await prisma.blog.findMany();
    return c.json({ blogs });
  });

  
blogRouter.get('/:id', async (c) => {

    const id = c.req.param('id')

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id: Number(id),
      },
    });

    return c.json({
      blog,
    });
  } catch (error) {
    c.status(411);
    return c.json({ error });
  }
});

