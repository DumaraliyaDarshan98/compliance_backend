import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) return null;

    const token = authHeader.split(' ')[1]; // Extract token (Bearer <token>)
    
    try {
        const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
        const decoded = jwtService.decode(token);
        
        return data ? decoded?.[data] : decoded; // If `data` is provided, return only that field (e.g., `id`, `email`).
    } catch (error) {
        return null;
    }
});
