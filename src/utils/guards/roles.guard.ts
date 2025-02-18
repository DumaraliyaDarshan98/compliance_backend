import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles) {
            return true; // If no role is required, allow access
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user; // Extract user from request (JWT should populate this)
        console.log('request.user', user);
        return requiredRoles.includes(user?.role); // Allow only if the user has the required role
    }
}
