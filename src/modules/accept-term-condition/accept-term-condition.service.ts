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
import { AcceptTermCondition, AcceptTermConditionDocument } from './schema/accept-term-condition.schema';
import { Employee, EmployeeDocument } from "src/modules/employee/schema/employee.schema";
import * as mongoose from "mongoose";
import { Gender, ROLES } from 'src/utils/enums/index.enum';

@Injectable()
export class AcceptTermConditionService {
    constructor(
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
        @InjectModel(AcceptTermCondition.name) private readonly acceptTearmConditionModel: Model<AcceptTermConditionDocument>,
    ) {}

    async saveDetail(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "employeeId", message: "Employee Id is required" },
                { field: "subPolicyId", message: "Sub Policy Id is required" },
                { field: "ipAddress", message: "Ip Address is required" },
                { field: "location", message: "Loction is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            const existingDetails = await this.acceptTearmConditionModel.findOne({
                employeeId: payload?.employeeId,
                subPolicyId: payload?.subPolicyId,
            }).exec();

            if (existingDetails) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Term & Condition already accepted',
                };
            }

            const conditionAccept = new this.acceptTearmConditionModel(payload);
            const data = await conditionAccept.save();
            
            return {
                code: HttpStatus.CREATED,
                message: "Term & Condition accepted",
                data: {
                    detail: data
                },
            };
        } catch (error) {
            console.error("Error saveDetail:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async getDetail(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "employeeId", message: "Employee Id is required" },
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

            const detail = await this.acceptTearmConditionModel.findOne({
                employeeId: payload?.employeeId,
                subPolicyId: payload?.subPolicyId,
            }).exec();

            if (!detail) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Term & Condition detail not found',
                };
            }

            return {
                code: HttpStatus.CREATED,
                message: "Term & Condition detail",
                data: {
                    detail: detail
                },
            };
        } catch (error) {
            console.error("Error saveDetail:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

     // Method to get sub policy info list
    async getSubPolicyConditionList(payload: any): Promise<APIResponseInterface<any>> {
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
            const empCompletedList = await this.conditionList('EMPLOYEE', payload);
            const lineManagerCompletedlist = await this.conditionList('LINE_MANAGER', payload);
            const completedCount = empCompletedList.count + lineManagerCompletedlist.count;

            payload.listType = 2;
            const empOutStadingList = await this.conditionList('EMPLOYEE', payload);
            const lineManagerOutStadinglist = await this.conditionList('LINE_MANAGER', payload);
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
    async conditionList(role: any, payload: any) {
        const matchQuery: any = { subPolicyId: new mongoose.Types.ObjectId(payload?.subPolicyId) };

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$employeeId",
                },
            },
        ];

        const array = await this.acceptTearmConditionModel.aggregate(pipeline);

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
                        from: "accepted_terms_conditions",
                        localField: "_id",
                        foreignField: "employeeId",
                        as: "conditionDetail",
                    },
                },
                {
                    $match: {
                        "conditionDetail.subPolicyId": new mongoose.Types.ObjectId(payload.subPolicyId),
                    },
                },
                { $unwind: "$conditionDetail" }, // Flatten the resultDetails array
                { $sort: { "conditionDetail._id": -1 } },
                {
                    $group: {
                        _id: "$_id",
                        firstName: { $first: "$firstName" },
                        middleName: { $first: "$middleName" },
                        lastName: { $first: "$lastName" },
                        conditionDetail: { $push: '$conditionDetail' },
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
