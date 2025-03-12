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

@Injectable()
export class ResultService {
    constructor(
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Result.name) private readonly resultModel: Model<ResultDocument>,
    ) {}

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

            if (payload?.searchTest) {
                matchQuery.name = { $regex: new RegExp(payload?.searchTest, 'i') };
            }

            const sort: any = {};
            if (payload?.orderBy) {
                if (payload?.orderBy.name) {
                    sort['name'] = parseInt(payload?.orderBy.name, 10);
                } else if (payload?.orderBy.result) {
                    sort['resultDetails._id'] = parseInt(payload?.orderBy.result, 10);
                }
            } else {
                sort['resultDetails._id'] = -1;
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
            const completedCount = empCompletedList.length + lineManagerCompletedlist.length;

            payload.listType = 2;
            const empOutStadingList = await this.getAdminEmployeeList('EMPLOYEE', payload);
           const lineManagerOutStadinglist = await this.getAdminEmployeeList('LINE_MANAGER', payload);
            const OutStadingCount = empOutStadingList.length + lineManagerOutStadinglist.length;

            const data = {
                completedCount: completedCount,
                empCompletedList: empCompletedList,
                lineManagerCompletedlist: lineManagerCompletedlist,
                OutStadingCount:OutStadingCount,
                empOutStadingList:empOutStadingList,
                lineManagerOutStadinglist:lineManagerOutStadinglist
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

        const empSort: any = {};
        if (payload?.orderBy) {
            if (payload?.orderBy.name) {
                empSort['name'] = parseInt(payload?.orderBy.name, 10);
            } else if (payload?.orderBy.result) {
                empSort['resultDetails._id'] = parseInt(payload?.orderBy.result, 10);
            }
        } else {
            empSort['_id'] = -1;
        }

        if(payload.listType == 1) {
        const empPipeline: PipelineStage[] = [
            { $match: empMatchQuery },
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
            { $sort: { "resultDetails._id" : -1 } },
            {
                $group: {
                    _id: "$_id",
                    firstName: { $first: "$firstName" },
                    middleName: { $first: "$middleName" },
                    lastName: { $first: "$lastName" },
                    resultDetails: { $push: '$resultDetails' },
                },
            },
            { $sort: empSort },
        ];
        return await this.employeeModel.aggregate(empPipeline);

        } else {
        const empPipeline: PipelineStage[] = [
            { $match: empMatchQuery },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    middleName: 1,
                    lastName: 1,
                },
            },
            { $sort: empSort },
        ];
                return await this.employeeModel.aggregate(empPipeline);
        }

    }
}
