import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { SubPolicy, SubPolicyDocument } from 'src/modules/sub-policy/schema/sub-policy.schema';
import { Question, QuestionDocument } from "./schema/question.schema";
import { Option, OptionDocument } from 'src/modules/option/schema/option.schema';
import * as mongoose from 'mongoose';
import { QUESTION_TYPE, USER_GROUP } from 'src/utils/enums/index.enum';

@Injectable()
export class QuestionService {
    constructor(
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Option.name) private readonly optionModel: Model<OptionDocument>,
        @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    ) {}

    // Create a question with options
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

            // Save questions and options
            for (const question of payload.questions) {
                const questionData = {
                    questionText: question.questionText,
                    questionType: question.questionType,
                    subPolicyId: payload.subPolicyId,
                    userGroup: payload.userGroup,
                    answer: question.answer,
                    isActive: (question?.isActive !== undefined && question?.isActive !== null) ? question.isActive : 1,
                };

                const createdQuestion = new this.questionModel(questionData);
                await createdQuestion.save();

                const questionId = createdQuestion._id;

                if (question.options) {
                    let options = question.options;

                    for (const option of options) {
                        const optionData = {
                            questionId: questionId,
                            optionText: option.value,
                            optionIndex: option.index,
                        };

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

    // Get all questions based on filter criteria
    async getAllquestion(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
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

            // Match query for filtering questions
            const matchQuery: any = {
                subPolicyId: subPolicyId,
                userGroup: userGroup,
            };

            // If isActive is provided (true or false), add it to the filter
            if (payload?.isActive !== undefined) {
                matchQuery.isActive = payload?.isActive;
            }

            if (payload?.searchText && payload.searchText.trim() !== "") {
                matchQuery.questionText = { $regex: payload.searchText, $options: 'i' };
            }

            let sortOptions = {};
            if (payload.sortBy && payload.sortOrder) {
                sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1;
            } else {
                sortOptions['_id'] = -1;
            }

            var pageNumber = payload.pageNumber || 1;
            var pageLimit = payload.pageLimit || 10;
            const pageOffset = (pageNumber - 1) * pageLimit;
            
            const pipeline: PipelineStage[] = [
                {
                    $match: matchQuery, // Match questions based on filter criteria
                },
                {
                    $project: {
                        _id: 1,
                        subPolicyId: 1,
                        userGroup: 1,
                        questionText: 1,
                        questionType: 1,
                        answer: 1,
                    },
                },
                {
                    $addFields: {
                        questionTypeText: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.CHECKBOX] }, then: 'Checkbox' },
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.BOOLEAN] }, then: 'Boolean' },
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.MCQ] }, then: 'MCQ' },
                                ],
                                default: 'Unknown',  // Fallback value if no match
                            },
                        },
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
                    $sort : sortOptions,
                },
            ];

            var countResult = await this.questionModel.aggregate(pipeline);

            pipeline.push({
                    $skip: pageOffset
                }, 
                {
                    $limit: pageLimit
                } 
            );

            var selectedQuestions = await this.questionModel.aggregate(pipeline);

            if (payload?.size !== undefined) {

                let size = Number(payload?.size);
                const allQuestions = selectedQuestions;

                if(allQuestions?.length  == 0) {
                    return  {
                        code: HttpStatus.OK,
                        message: 'Question list not found',
                    };
                }

                if(size > allQuestions.length) {
                    size = allQuestions.length;
                }

                // Ensure that randomNumber does not exceed the available questions
                const randomNumber = Math.min(Math.floor(Math.random() * size) + 1, allQuestions.length); 

                // Step 3: Generate random indices
                const randomIndices: Set<number> = new Set(); // Explicitly declare the Set type as number

                while (randomIndices.size < size) {
                    const randIndex = Math.floor(Math.random() * allQuestions.length);
                    randomIndices.add(randIndex);
                }

                // Step 4: Select documents based on random indices
                selectedQuestions = Array.from(randomIndices).map((index: number) => allQuestions[index]);
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (selectedQuestions.length === 0) {
                return {
                    code: HttpStatus.OK,
                    message: 'Question list not found',
                };
            }

            return {
                code: HttpStatus.OK,
                message: "Question list.",
                data: {
                    questionList: selectedQuestions,
                    count: countResult.length,
                    pageNumber: pageNumber,
                    pageLimit: pageLimit
                },
            };

        } catch (error) {
            console.error("Error getAllquestion:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    // Delete a question by ID
    async deleteById(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Question Id is required",
                };
            }

            const result = await this.questionModel.findByIdAndDelete(payload.id).exec();
            if (!result) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: `Question with ID ${payload?.id} not found`,
                };
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
            };
        }
    }

    // Update question details
    async updateQuestion(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "id", message: "Question Id is required" },
                { field: "questionText", message: "Question Text is required" },
                { field: "questionType", message: "Question Type is required" },
                { field: "options", message: "Options are required" },
                { field: "userGroup", message: "User Group is required" },
                { field: "isActive", message: "Status is required" },
                { field: "answer", message: "Answer is required" },
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

            // Update question
            existingQuestion.questionText = payload.questionText;
            existingQuestion.questionType = payload.questionType;
            existingQuestion.userGroup = payload.userGroup;
            existingQuestion.answer = payload.answer;
            existingQuestion.isActive = payload?.isActive,
            await existingQuestion.save();

            // Delete old options and add new ones
            await this.optionModel.deleteMany({ questionId: payload.id });

            if (payload.options && Array.isArray(payload.options)) {

                for (const option of payload.options) {
                    const optionData = {
                        questionId: payload.id,
                        optionText: option.value,
                        optionIndex: option.index,
                    };

                    const createOption = new this.optionModel(optionData);
                    await createOption.save();
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

    // Get question details by ID
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
                { $match: { _id: id } },
                {
                    $project: {
                        _id: 1,
                        subPolicyId: 1,
                        userGroup: 1,
                        questionText: 1,
                        questionType: 1,
                        answer: 1,
                    },
                },
                {
                    $addFields: {
                        questionTypeText: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.CHECKBOX] }, then: 'Checkbox' },
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.BOOLEAN] }, then: 'Boolean' },
                                    { case: { $eq: ['$questionType', QUESTION_TYPE.MCQ] }, then: 'MCQ' },
                                ],
                                default: 'Unknown',  // Fallback value if no match
                            },
                        },
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
