import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { SubPolicy, SubPolicyDocument } from 'src/modules/sub-policy/schema/sub-policy.schema';
import { Question, QuestionDocument } from "./schema/question.schema";
import { Option, OptionDocument } from 'src/modules/option/schema/option.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class QuestionService {
    constructor(
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Option.name) private readonly optionModel: Model<OptionDocument>,
        @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    ) {}

    async createQuestion(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "subPolicyId", message: "Sub Policy Id is required" },
                { field: "questions", message: "Question's array is required" },
                { field: "userGroup", message: "User Group is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const subPolicyExists = await this.subPolicyModel.findById(payload?.subPolicyId).exec();

            if (!subPolicyExists) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Sub Policy not found',
                };
            }

            for (const question of payload.questions) {
                const questionData = {
                    questionText: question.questionText,
                    questionType: question.questionType,
                    subPolicyId: payload.subPolicyId,
                    userGroup: payload.userGroup,
                };

                const createdQuestion = new this.questionModel(questionData);
                await createdQuestion.save();

                const questionId = createdQuestion._id;

                if (question.options) {
                    let options = question.options;
                    let optionId = 1;

                    for (let i = 0; i < options.length; i++) {
                        const optionData = {
                            questionId: questionId,
                            optionText: options[i],
                            optionId: optionId,
                        };

                        optionId++;
                        const createOption = new this.optionModel(optionData);
                        await createOption.save();
                    }
                }
            }

            return {
                code: HttpStatus.CREATED,
                message: 'Question created successfully',
            };
        } catch (error) {
            console.error("Error createQuestion:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async getAllquestion(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "subPolicyId", message: "Sub Policy Id is required" },
                { field: "userGroup", message: "User Group is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const subPolicyId = new mongoose.Types.ObjectId(payload.subPolicyId);
            const userGroup = payload.userGroup;

            // Optional: Add questionText if it's not empty
            const matchQuery: any = {
                subPolicyId: subPolicyId,
                userGroup: userGroup,
            };

            if (payload?.questionText && payload.questionText.trim() !== "") {
                matchQuery.questionText = { $regex: payload.questionText, $options: 'i' };
            }

            const result = await this.questionModel.aggregate([
                {
                    $match: matchQuery,
                },
                {
                    $project: {
                        subPolicyId: 1,
                        userGroup: 1,
                        questionText: 1,
                        questionType: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'options',
                        localField: '_id',
                        foreignField: 'questionId',
                        as: 'optionsDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$optionsDetails',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        _id: '$subPolicyId',
                        questionText: { $first: '$questionText' },
                        questionType: { $first: '$questionType' },
                        userGroup: { $first: '$userGroup' },
                        optionsDetails: { $push: '$optionsDetails' },
                    },
                },
                {
                    $sort: {
                        'optionsDetails.optionId': 1,
                    },
                },
            ]);

            if (result.length === 0) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Not Found',
                };
            }

            return {
                code: HttpStatus.CREATED,
                message: 'Question List',
                data: result,
            };

        } catch (error) {
            console.error("Error getAllquestion:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async deleteById(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Question Id is required",
                }
            }

            const result = await this.questionModel.findByIdAndDelete(payload.id).exec();
            if (!result) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: `Question with ID ${payload?.id} not found`,
                }
            }

            await this.optionModel.deleteMany({ questionId: payload.id });

            return {
                code: HttpStatus.OK,
                message: `Delete with ID ${payload?.id} deleted successfully`,
            };
        } catch (error) {
            console.error("Error deleteById:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }

    async updateQuestion(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "id", message: "Question Id is required" },
                { field: "questionText", message: "Question Text is required" },
                { field: "questionType", message: "Question Type is required" },
                { field: "options", message: "Options is required" },
                { field: "userGroup", message: "User Group is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const existingQuestion = await this.questionModel.findById(payload.id);

            if (!existingQuestion) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Question not found',
                };
            }

            existingQuestion.questionText = payload.questionText || existingQuestion.questionText;
            existingQuestion.questionType = payload.questionType || existingQuestion.questionType;
            existingQuestion.userGroup = payload.userGroup || existingQuestion.userGroup;
            await existingQuestion.save();

            await this.optionModel.deleteMany({ questionId: payload.id });

            if (payload.options && Array.isArray(payload.options)) {
                let optionId = 1;

                for (const optionText of payload.options) {
                    const optionData = {
                        questionId: payload.id,
                        optionText: optionText,
                        optionId: optionId,
                    };

                    const createOption = new this.optionModel(optionData);
                    await createOption.save();
                    optionId++;
                }
            }

            return {
                code: HttpStatus.CREATED,
                message: 'Question Updated successfully',
            };
        } catch (error) {
            console.error("Error updateQuestion:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async questionDetail(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "id", message: "Question Id is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const id = new mongoose.Types.ObjectId(payload.id);

            const result = await this.questionModel.aggregate([
                {
                    $match: {
                        _id: id,
                    },
                },
                {
                    $project: {
                        subPolicyId: 1,
                        userGroup: 1,
                        questionText: 1,
                        questionType: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'options',
                        localField: '_id',
                        foreignField: 'questionId',
                        as: 'optionsDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$optionsDetails',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        _id: '$subPolicyId',
                        questionText: { $first: '$questionText' },
                        questionType: { $first: '$questionType' },
                        userGroup: { $first: '$userGroup' },
                        optionsDetails: { $push: '$optionsDetails' },
                    },
                },
                {
                    $sort: {
                        'optionsDetails.optionId': 1,
                    },
                },
            ]);

            if (result.length === 0) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Not Found',
                };
            }

            return {
                code: HttpStatus.OK,
                message: 'Question Detail',
                data: result,
            };
        } catch (error) {
            console.error("Error questionDetail:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }
}
