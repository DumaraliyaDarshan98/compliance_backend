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
import * as mongoose from 'mongoose';

@Injectable()
export class AnswerService {
    constructor(
        @InjectModel(Result.name) private readonly resultModel: Model<ResultDocument>,
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
        @InjectModel(Answer.name) private readonly answerModel: Model<AnswerDocument>,
    ) {}

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
                                isActive : 1              
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
                subPolicyId : payload.subPolicyId,
                employeeId : payload.userId,
                score : score,
                resultStatus : resultStatus,
                created_by : payload.userId,
                duration : payload.duration,
                submitDate : new Date()
            };

            const saveResult = new this.resultModel(resultArray);
                                await saveResult.save();

            let answerArray: any = [];
            
            payload.answers.forEach(item => {
              answerArray.push({
                subPolicyId : payload.subPolicyId,
                questionId : item.questionId,
                resultId : saveResult._id,
                answer: item.answer,
                employeeId : payload.userId,
                created_by: payload.userId
              });
            });

            await this.answerModel.insertMany(answerArray);

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

          var resultId = new mongoose.Types.ObjectId(payload.resultId);
 
          var pipeline: PipelineStage[] = [
                    {
                         $match : {
                              resultId : resultId
                         }
                    },
                    {
                         $project: {
                              _id: 1,
                              subPolicyId: 1,
                              questionId: 1,
                              employeeId: 1,
                              resultId :1,
                              answer:1
                         },
                    },
                    {
                         $lookup: {
                              from: "questions",
                              localField: "_id",
                              foreignField: "questionId",
                              as: "questionDetails",
                         },
                    }
               ];

          var data = await this.answerModel.aggregate(pipeline);
      
          return {
               code: HttpStatus.CREATED,
               message: "Question list successfully",
               data: data,
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
