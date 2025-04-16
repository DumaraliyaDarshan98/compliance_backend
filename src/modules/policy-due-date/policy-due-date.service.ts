import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PolicyDueDate, PolicyDueDateDocument } from "./schema/policy-due-date.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { SubPolicy, SubPolicyDocument } from 'src/modules/sub-policy/schema/sub-policy.schema';
import { Employee, EmployeeDocument } from "src/modules/employee/schema/employee.schema";

@Injectable()
export class PolicyDueDateService {
    constructor(
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
        @InjectModel(PolicyDueDate.name) private readonly policyDueDateModel: Model<PolicyDueDateDocument>, // Injecting the Mongoose model
    ) {}

    async upsertPolicyDueDate(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "subPolicyId", message: "Sub Policy Id is required" },
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

            // Check if the policy exists
            const subPolicyId = new Types.ObjectId(payload.subPolicyId);
            const policyExists = await this.subPolicyModel.findById(subPolicyId).exec();

            if (!policyExists) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Sub Policy not found',
                };
            }

            // Check if the employee exists
            const employeeId = new Types.ObjectId(payload.employeeId);
            const employeeExists = await this.employeeModel.findById(employeeId).exec();

            if (!employeeExists) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Employee not found',
                };
            }

            // Check if a policy setting already exists for the given policyId
            const existingPolicyDueDate = await this.policyDueDateModel.findOne({ subPolicyId: subPolicyId, employeeId: employeeId}).exec();

            let savedPolicyDueDate;

            if (existingPolicyDueDate) {
                // Update existing policy settings
                existingPolicyDueDate.dueDate = payload.dueDate || existingPolicyDueDate.dueDate;

                savedPolicyDueDate = await existingPolicyDueDate.save();
            } else {

                // Validate required fields
                const requiredFields = [
                    { field: "dueDate", message: "Due Date is required" },
                ];

                for (const { field, message } of requiredFields) {
                    if (!payload?.[field]) {
                        return {
                            code: HttpStatus.BAD_REQUEST,
                            message,
                        };
                    }
                }

                // Create a new policy setting
                const newPolicyDueDate = new this.policyDueDateModel(payload);
                savedPolicyDueDate = await newPolicyDueDate.save();
            }

            return {
                code: HttpStatus.CREATED,
                message: "Policy Due Date saved successfully",
                data: savedPolicyDueDate,
            };
        } catch (error) {
            console.error("Error upsertPolicyDueDate:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

}
