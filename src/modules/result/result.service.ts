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
import { SubPolicy, SubPolicyDocument } from "src/modules/sub-policy/schema/sub-policy.schema";
import { Result, ResultDocument } from "./schema/result.schema";
import * as mongoose from "mongoose";
import { ANSWER_STATUS } from "src/utils/enums/index.enum";
import { PolicySetting, PolicySettingDocument } from "src/modules/policy-setting/schema/policy-setting.schema";

@Injectable()
export class ResultService {
     constructor(
          @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
          @InjectModel(Result.name) private readonly resultModel: Model<ResultDocument>,
     ) {}

     async getList(payload: any): Promise<APIResponseInterface<any>> {
          try {
               // Validate required fields
               const requiredFields = [
                    { field: "employeeId", message: "Employee Id is required" }
               ];

               for (const { field, message } of requiredFields) {
                    if (!payload?.[field]) {
                         return {
                              code: HttpStatus.BAD_REQUEST,
                              message,
                         };
                    }
               }

               // Match query for filtering questions
               var matchQuery: any = {
                    isActive: 1,
               };

               if (payload?.searchTest) {
                    matchQuery.name = { $regex: new RegExp(payload?.searchTest, 'i') }
               }

               const sort: any = {}
               if (payload?.orderBy) {
                    if (payload?.orderBy.name) {
                         sort['name'] = parseInt(payload?.orderBy.name, 10);
                    } else if (payload?.orderBy.result) {
                         sort['resultDetails.createdAt'] = parseInt(payload?.orderBy.result, 10);
                    }
               } else {
                    sort['resultDetails.createdAt'] = -1;
               }
               const pipeline: PipelineStage[] = [
                    {
                         $match: matchQuery,
                    },
                    {
                         $project: {
                              _id: 1,
                              policyId: 1,
                              name: 1,
                              version: 1,
                              description: 1,
                         },
                    },
                    {
                         $lookup: {
                              from: "policy_settings",
                              localField: "_id",
                              foreignField: "subPolicyId",
                              as: "policySettingDetails",
                         },
                    },
                    {
                         $lookup: {
                              from: "results",
                              localField: "_id",
                              foreignField: "subPolicyId",
                              as: "resultDetails",
                         },
                    },
                    {
                         $match: {
                              "resultDetails.employeeId": new mongoose.Types.ObjectId(payload.employeeId),
                         },
                    },
                    {
                         $unwind: "$resultDetails", // Flatten the resultDetails array
                    },
                    {
                         $group: {
                              _id: "$_id",
                              policyId: { $first: "$policyId" },
                              name: { $first: "$name" },
                              version: { $first: "$version" },
                              description: { $first: "$description" },
                              policySettingDetails: { $first: "$policySettingDetails" },
                              resultDetails: { $push: "$resultDetails" }, // Reassemble the resultDetails array
                         },
                    },
                    {
                         $sort: sort,
                    },
               ];

               const result = await this.subPolicyModel.aggregate(pipeline);

               if (result.length === 0) {
                    return {
                         code: HttpStatus.NOT_FOUND,
                         message: 'Not Found',
                    };
               }

               return {
                    code: HttpStatus.CREATED,
                    message: "Result list successfully",
                    data: result,
               };
          } catch (error) {
               console.error("Error getList:", error);
               return {
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message,
               };
          }
     }

     async getOutStandingList(payload: any): Promise<APIResponseInterface<any>> {
          try {
               // Validate required fields
               const requiredFields = [
                    { field: "employeeId", message: "Employee Id is required" }
               ];

               for (const { field, message } of requiredFields) {
                    if (!payload?.[field]) {
                         return {
                              code: HttpStatus.BAD_REQUEST,
                              message,
                         };
                    }
               }

               // Match query for filtering questions
               var matchQuery: any = {
                    isActive: 1,
               };

               const pipeline: PipelineStage[] = [
                    {
                         $match: matchQuery,
                    },
                    {
                         $project: {
                              _id: 1,
                              policyId: 1,
                              name: 1,
                              version: 1,
                              description: 1,
                              createdAt: 1
                         },
                    },
                    {
                         $sort: {
                              createdAt: -1
                         },
                    },
                    {
                         $lookup: {
                              from: "policy_settings",
                              localField: "_id",
                              foreignField: "subPolicyId",
                              as: "policySettingDetails",
                         },
                    },
                    {
                         $lookup: {
                              from: "results",
                              localField: "_id",
                              foreignField: "subPolicyId",
                              as: "resultDetails",
                         },
                    },
                    {
                         // Filter for cases where resultDetails does not contain the employeeId
                         $match: {
                              $or: [
                                   { "resultDetails": { $eq: null } }, // If resultDetails is null
                                   { "resultDetails": { $size: 0 } }, // If resultDetails is an empty array
                                   { "resultDetails.employeeId": { $ne: new mongoose.Types.ObjectId(payload.employeeId) } }, // If the employeeId doesn't match
                              ],
                         },
                    },
                    {
                         $group: {
                              _id: "$_id",
                              policyId: { $first: "$policyId" },
                              name: { $first: "$name" },
                              version: { $first: "$version" },
                              description: { $first: "$description" },
                              createdAt: { $first: "$createdAt" },
                              policySettingDetails: { $first: "$policySettingDetails" },
                              resultDetails: { $push: "$resultDetails" }, // Reassemble the resultDetails array
                         },
                    },
               ];

               const result = await this.subPolicyModel.aggregate(pipeline);

               if (result.length === 0) {
                    return {
                         code: HttpStatus.NOT_FOUND,
                         message: 'Not Found',
                    };
               }

               return {
                    code: HttpStatus.CREATED,
                    message: "Result list successfully",
                    data: result,
               };
          } catch (error) {
               console.error("Error getOutStandingList:", error);
               return {
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message,
               };
          }
     }
}
