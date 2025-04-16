import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Option, OptionSchema } from './schema/option.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Option.name, schema: OptionSchema }]),
    ],
    exports: [MongooseModule]
})
export class OptionModule {}
