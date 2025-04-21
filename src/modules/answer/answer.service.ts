import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId, PipelineStage } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { Answer, AnswerDocument } from "./schema/answer.schema";
import { SubPolicy, SubPolicyDocument } from 'src/modules/sub-policy/schema/sub-policy.schema';
import { Question, QuestionDocument } from "src/modules/question/schema/question.schema";
import { Result, ResultDocument } from "src/modules/result/schema/result.schema";
import { Option, OptionDocument } from 'src/modules/option/schema/option.schema';
import * as mongoose from 'mongoose';
import { SubPolicyService } from "../sub-policy/sub-policy.service";
import { EmployeeService } from "../employee/employee.service";
import { MailerService } from "src/utils/mailer/mailer.service";

@Injectable()
export class AnswerService {
    constructor(
        @InjectModel(Result.name) private readonly resultModel: Model<ResultDocument>,
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
        @InjectModel(Option.name) private readonly optionModel: Model<OptionDocument>,
        @InjectModel(Answer.name) private readonly answerModel: Model<AnswerDocument>,
        private subPolicyService: SubPolicyService,
        private employeeService: EmployeeService,
        private mailService: MailerService
    ) { }

    async saveAnswer(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "subPolicyId", message: "Sub Policy Id is required" },
                { field: "userGroup", message: "User Group is required" },
                { field: "answers", message: "Answer is required" },
                { field: "passingScore", message: "Passing Score is required" },
                { field: "marksPerQuestion", message: "Marks Per Question is required" },
                { field: "duration", message: "Duration is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const questions = await this.questionModel.find({
                subPolicyId: payload?.subPolicyId,
                userGroup: payload?.userGroup,
                isActive: 1
            }).select('_id questionText answer').exec();

            if (!questions) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Question list not found',
                };
            }

            let query = { $or: [] };

            payload.answers.forEach(item => {
                query.$or.push({
                    $and: [
                        { "_id": new mongoose.Types.ObjectId(item.questionId) },
                        { "answer": item.answer }
                    ]
                });
            });

            const correctQuestionCount = await this.questionModel.countDocuments(query);

            const score = correctQuestionCount * payload.marksPerQuestion;
            const resultStatus = score >= payload.passingScore ? 1 : 2;
            const resultArray: any = {
                subPolicyId: payload.subPolicyId,
                employeeId: payload.userId,
                score: score,
                resultStatus: resultStatus,
                created_by: payload.userId,
                duration: payload.duration,
                submitDate: new Date()
            };

            const saveResult = new this.resultModel(resultArray);
            await saveResult.save();

            let answerArray: any = [];

            payload.answers.forEach(item => {
                answerArray.push({
                    subPolicyId: payload.subPolicyId,
                    questionId: item.questionId,
                    resultId: saveResult._id,
                    answer: item.answer,
                    employeeId: payload.userId,
                    created_by: payload.userId
                });
            });

            await this.answerModel.insertMany(answerArray);

            const subPolicyData = await this.subPolicyService.findById({ id: payload.subPolicyId });

            const employeeData = await this.employeeService.findById(payload.userId);

            const data = {
                testName: subPolicyData?.data?.[0]?.version,
                score: score,
                result: Number(resultStatus) == 2 ? 'Fail' : 'Pass',
                date: new Date(),
                examDuration: this.convertDecimalMinutesToMinSec(Number(payload.duration)),
                email: employeeData?.data?.email
            }

            await this.SendResultOnMail(data);

            return {
                code: HttpStatus.CREATED,
                message: 'Result has generated successfully.',
            };
        } catch (error) {
            console.error("Error createQuestion:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    convertDecimalMinutesToMinSec(decimalMinutes: number): string {
        const totalSeconds = Math.round(decimalMinutes * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const minPart = minutes > 0 ? `${minutes} Min` : '';
        const secPart = seconds > 0 ? `${seconds} Sec` : '';

        return `${minPart} ${secPart}`.trim();
    }

    async SendResultOnMail(details: any) {
        const emailContent = `<!DOCTYPE html>
                <html>
                <head>
                    <title>Exam Result - ${details?.testName}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .header {
                            background-color: #28a745;
                            padding: 20px;
                            text-align: center;
                            color: white;
                            font-size: 24px;
                            font-weight: bold;
                            border-top-left-radius: 5px;
                            border-top-right-radius: 5px;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 5px;
                            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .content {
                            font-size: 16px;
                            color: #333333;
                            padding: 20px 0;
                        }
                        .result-table {
                            width: 100%;
                            margin-top: 20px;
                            border-collapse: collapse;
                        }
                        .result-table th, .result-table td {
                            text-align: left;
                            padding: 10px;
                            border-bottom: 1px solid #dddddd;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 12px;
                            color: #777777;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">Exam Results</div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Here are your exam details:</p>
                            <table class="result-table">
                                <tr>
                                    <th>Version</th>
                                    <td>${details?.testName}</td>
                                </tr>
                                <tr>
                                    <th>Exam Duration</th>
                                    <td>${details?.examDuration}</td>
                                </tr>
                                <tr>
                                    <th>Score</th>
                                    <td>${details?.score}</td>
                                </tr>
                                <tr>
                                    <th>Result</th>
                                    <td>${details?.result}</td>
                                </tr>
                                <tr>
                                    <th>Date</th>
                                    <td>${details?.date}</td>
                                </tr>
                            </table>
                            <p>Thank you for participating!</p>
                        </div>
                        <p class="footer">
                            Compliance Team | This is an automated message. Please do not reply.
                        </p>
                    </div>
                </body>
                </html>
                `;

        await this.mailService.sendResetPasswordEmail(details.email, emailContent, 'Exam Result - Compliance Basics');
    }

    async getTestQuestionList(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "resultId", message: "Result Id is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            // Handle dynamic sorting based on `sortBy` and `sortOrder`
            let sortOptions = {};
            if (payload.sortBy && payload.sortOrder) {
                sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1; // Ascending or descending
            } else {
                sortOptions['_id'] = -1;
            }

            var pageNumber = payload.pageNumber || 1;
            var pageLimit = payload.pageLimit || 10;
            const pageOffset = (pageNumber - 1) * pageLimit; // Calculate the offset

            var resultId = new mongoose.Types.ObjectId(payload.resultId);

            var pipeline: PipelineStage[] = [
                {
                    $match: {
                        resultId: resultId
                    }
                },
                {
                    $project: {
                        _id: 1,
                        subPolicyId: 1,
                        questionId: 1,
                        employeeId: 1,
                        resultId: 1,
                        answer: 1,
                        createdAt: 1
                    },
                },
                {
                    $lookup: {
                        from: "questions",
                        localField: "questionId",
                        foreignField: "_id",
                        as: "questionDetails",
                    },
                },
                {
                    $lookup: {
                        from: 'options',
                        localField: 'questionId',
                        foreignField: 'questionId',
                        as: 'optionsDetails',
                    },
                },
                {
                    $unwind: {
                        path: "$questionDetails",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $unwind: {
                        path: "$policySettings",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $sort: sortOptions,
                },
                {
                    $addFields: {
                        "questionDetails.options": "$optionsDetails"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        subPolicyId: { $first: "$subPolicyId" },
                        questionId: { $first: "$questionId" },
                        employeeId: { $first: "$employeeId" },
                        resultId: { $first: "$resultId" },
                        answer: { $first: "$answer" },
                        createdAt: { $push: "$createdAt" },
                        questionDetails: { $push: "$questionDetails" },
                    },
                },
            ];

            var countResult = await this.answerModel.aggregate(pipeline);

            pipeline.push({
                $skip: pageOffset
            },
                {
                    $limit: pageLimit
                }
            );

            var data = await this.answerModel.aggregate(pipeline);

            if (data.length <= 0) {
                return {
                    code: HttpStatus.OK,
                    message: "Question list not found."
                }
            }

            return {
                code: HttpStatus.OK,
                message: "Question list successfully",
                data: {
                    answerList: data,
                    count: countResult.length,
                    pageNumber: pageNumber,
                    pageLimit: pageLimit
                },
            };
        } catch (error) {
            console.error("Error getList:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }
}
