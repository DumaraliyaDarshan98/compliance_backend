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
import { Employee, EmployeeDocument } from "src/modules/employee/schema/employee.schema";
import { Gender, ROLES } from 'src/utils/enums/index.enum';
import { AcceptTermCondition, AcceptTermConditionDocument } from 'src/modules/accept-term-condition/schema/accept-term-condition.schema';

@Injectable()
export class ResultService {
    constructor(
        @InjectModel(AcceptTermCondition.name) private readonly acceptTearmConditionModel: Model<AcceptTermConditionDocument>,
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Result.name) private readonly resultModel: Model<ResultDocument>,
    ) { }

    // Method to get list of results
    async getList(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "employeeId", message: "Employee Id is required" },
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
            let matchQuery: any = { isActive: 1 };

            if (payload?.searchText && payload.searchText.trim() !== "") {
                matchQuery.name = { $regex: payload.searchText, $options: 'i' };
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
                        from: "accepted_terms_conditions",
                        localField: "_id",
                        foreignField: "subPolicyId",
                        as: "conditionDetail",
                    },
                },
                {
                    $match: {
                        "conditionDetail.employeeId": new mongoose.Types.ObjectId(payload.employeeId),
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
                        resultDetails: { $push: "$resultDetails" }, 
                        conditionDetail: { $push: "$conditionDetail" }, 
                    },
                },
                {
                    $sort: sortOptions,
                }
            ];

            const countResult = await this.subPolicyModel.aggregate(pipeline);

            pipeline.push({
                $skip: pageOffset
            },
                {
                    $limit: pageLimit
                }
            );

            const result = await this.subPolicyModel.aggregate(pipeline);

            if (result.length === 0) {
                return {
                    code: HttpStatus.OK,
                    message: "Result Not Found",
                };
            }

            return {
                code: HttpStatus.CREATED,
                message: "Result list",
                data: {
                    subPolicyList: result,
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

    // Method to get outstanding results
    async getOutStandingList(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "employeeId", message: "Employee Id is required" },
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
            let matchQuery: any = { isActive: 1 };

            if (payload?.searchText && payload.searchText.trim() !== "") {
                matchQuery.name = { $regex: payload.searchText, $options: 'i' };
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
                    $match: matchQuery,
                },
                {
                    $project: {
                        _id: 1,
                        policyId: 1,
                        name: 1,
                        version: 1,
                        description: 1,
                        createdAt: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
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
                        from: "accepted_terms_conditions",
                        localField: "_id",
                        foreignField: "subPolicyId",
                        as: "conditionDetail",
                    },
                },
                {
                    $unwind: {
                        path: "$conditionDetail", 
                        preserveNullAndEmptyArrays: true, 
                    },
                },

                {
                    $match: {
                        "conditionDetail.employeeId": new mongoose.Types.ObjectId(payload.employeeId),
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
                    $lookup: {
                        from: "policy_due_dates",
                        localField: "_id",
                        foreignField: "subPolicyId",
                        as: "policyDueDate",
                    },
                },
                {
                    $match: {
                        "policyDueDate.employeeId": { $ne: new mongoose.Types.ObjectId(payload.employeeId) },
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
                        resultDetails: { $push: "$resultDetails" },
                        policyDueDate: { $push: "$policyDueDate" },
                        conditionDetail: { $push: "$conditionDetail" }, 
                    },
                },
                {
                    $sort: sortOptions,
                }
            ];

            const countResult = await this.subPolicyModel.aggregate(pipeline);
            pipeline.push({
                $skip: pageOffset
            },
                {
                    $limit: pageLimit
                }
            );

            const result = await this.subPolicyModel.aggregate(pipeline);

            if (result.length === 0) {
                return {
                    code: HttpStatus.OK,
                    message: 'Not Found',
                };
            }

            return {
                code: HttpStatus.CREATED,
                message: "Result list successfully",
                data: {
                    subPolicyList: result,
                    count: countResult.length,
                    pageNumber: pageNumber,
                    pageLimit: pageLimit
                },
            };
        } catch (error) {
            console.error("Error getOutStandingList:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    // Method to get admin test employee list
    async getAdminTestEmployeeList(payload: any): Promise<APIResponseInterface<any>> {
        try {
            const requiredFields = [
                { field: "subPolicyId", message: "Sub Policy Id is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            payload.listType = 1;
            const empCompletedList = await this.getAdminEmployeeList('EMPLOYEE', payload);
            const lineManagerCompletedlist = await this.getAdminEmployeeList('LINE_MANAGER', payload);
            const completedCount = empCompletedList.count + lineManagerCompletedlist.count;

            payload.listType = 2;
            const empOutStadingList = await this.getAdminEmployeeList('EMPLOYEE', payload);
            const lineManagerOutStadinglist = await this.getAdminEmployeeList('LINE_MANAGER', payload);
            const OutStadingCount = empOutStadingList.count + lineManagerOutStadinglist.count;

            const data = {
                completedCount: completedCount,
                empCompletedCount: empCompletedList.count,
                empCompletedList: empCompletedList.result,
                lineManagerCompletedCount: lineManagerCompletedlist.count,
                lineManagerCompletedlist: lineManagerCompletedlist.result,
                OutStadingCount: OutStadingCount,
                empOutStadingCount: empOutStadingList.count,
                empOutStadingList: empOutStadingList.result,
                lineManagerOutStadingCount: lineManagerOutStadinglist.count,
                lineManagerOutStadinglist: lineManagerOutStadinglist.result
            };

            return {
                code: HttpStatus.CREATED,
                message: "Employee list successfully",
                data: data,
            };
        } catch (error) {
            console.error("Error getAdminTestEmployeeList:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    // Helper method to get employee or line manager list based on role
    async getAdminEmployeeList(role: any, payload: any) {
        const matchQuery: any = { subPolicyId: new mongoose.Types.ObjectId(payload?.subPolicyId) };

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$employeeId",
                },
            },
        ];

        const array = await this.resultModel.aggregate(pipeline);

        const ids = array.map((doc: any) => new mongoose.Types.ObjectId(doc._id));

        let empMatchQuery: any = {};
        if (payload.listType === 1) {
            empMatchQuery._id = { $in: ids };
        } else {
            empMatchQuery._id = { $nin: ids };
        }

        if (role === 'Admin') {
            empMatchQuery.role = ROLES.ADMIN;
        } else if (role === 'EMPLOYEE') {
            empMatchQuery.role = ROLES.EMPLOYEE;
        } else {
            empMatchQuery.role = ROLES.LINE_MANAGER;
        }

        if (payload?.searchTest) {
            empMatchQuery.firstName = { $regex: new RegExp(payload?.searchTest, 'i') };
            empMatchQuery.lastName = { $regex: new RegExp(payload?.searchTest, 'i') };
        }

        let sortOptions = {};
        if (payload.sortBy && payload.sortOrder) {
            sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1; // Ascending or descending
        } else {
            sortOptions['_id'] = -1;
        }

        var pageNumber = payload.pageNumber || 1;
        var pageLimit = payload.pageLimit || 10;
        const pageOffset = (pageNumber - 1) * pageLimit; // Calculate the offset

        const empPipeline: PipelineStage[] = [];
        if (payload.listType == 1) {
            empPipeline.push({
                $match: empMatchQuery
            },
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        middleName: 1,
                        lastName: 1,
                    },
                },
                {
                    $lookup: {
                        from: "results",
                        localField: "_id",
                        foreignField: "employeeId",
                        as: "resultDetails",
                    },
                },
                {
                    $match: {
                        "resultDetails.subPolicyId": new mongoose.Types.ObjectId(payload.subPolicyId),
                    },
                },
                { $unwind: "$resultDetails" }, // Flatten the resultDetails array
                { $sort: { "resultDetails._id": -1 } },
                {
                    $group: {
                        _id: "$_id",
                        firstName: { $first: "$firstName" },
                        middleName: { $first: "$middleName" },
                        lastName: { $first: "$lastName" },
                        resultDetails: { $push: '$resultDetails' },
                    },
                },
                { $sort: sortOptions },
            );

        } else {

            empPipeline.push(
                { $match: empMatchQuery },
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        middleName: 1,
                        lastName: 1,
                    },
                },
                { $sort: sortOptions },
            );
        }

        var countResult = await this.employeeModel.aggregate(empPipeline);

        empPipeline.push({
            $skip: pageOffset
        },
            {
                $limit: pageLimit
            }
        );

        var result = await this.employeeModel.aggregate(empPipeline);
        return { count: countResult.length, result: result };
    }
}
