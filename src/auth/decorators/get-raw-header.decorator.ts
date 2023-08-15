import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const GetRawHeaders = createParamDecorator((data, context: ExecutionContext) => {

    const req = context.switchToHttp().getRequest()

    console.log(req.rawHeaders);
    return req.rawHeaders;

})