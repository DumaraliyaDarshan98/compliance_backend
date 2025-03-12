import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { SubPolicy, SubPolicyDocument } from './schema/sub-policy.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { PolicySetting, PolicySettingDocument } from 'src/modules/policy-setting/schema/policy-setting.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class SubPolicyService {
  constructor(
    @InjectModel(PolicySetting.name)
    private readonly policySettingModel: Model<PolicySettingDocument>,

    @InjectModel(SubPolicy.name)
    private readonly subPolicyModel: Model<SubPolicyDocument>,
  ) { }

  async getAllSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
    try {
      // Validate if policyId is provided
      if (!payload?.policyId) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Policy Id is required',
        };
      }

      const policyId = new mongoose.Types.ObjectId(payload.policyId);

      // Dynamic filter object creation
      const matchQuery: any = { policyId: policyId };

      if (payload?.isActive !== undefined) {
        matchQuery.isActive = payload?.isActive;
      }

      const pipeline: PipelineStage[] = [
        {
          $match: matchQuery, // Apply filter criteria
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
          $lookup: {
            from: 'policy_settings', // Reference to policy settings collection
            localField: '_id', // Field from subPolicy
            foreignField: 'subPolicyId', // Field from policy_settings
            as: 'policySettings', // Output array of policySettings
          },
        }
      ];

      // If it's a frontend request, include policy settings with additional filters
      if (payload?.isFrontEndRequest === 1) {
        pipeline.push(
          {
            $match: {
              'policySettings.publishDate': { $lt: new Date() }, // Filter by publish date
              'policySettings.examTimeLimit': { $gte: new Date() }, // Filter by exam time limit
            },
          },
          {
            $unwind: '$policySettings',
          }
        );
      } else {
        pipeline.push(
          {
            $unwind: {
              path: "$policySettings",
              preserveNullAndEmptyArrays: true, // Keeps sub-policies even if there's no match
            },
          }
        )
      }

      // Execute aggregation pipeline
      const subPolicyList = await this.subPolicyModel.aggregate(pipeline);

      return {
        code: HttpStatus.OK,
        message: 'Sub Policy list',
        data: subPolicyList,
      };
    } catch (error) {
      console.error('Error getAllSubPolicy:', error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async createSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
    try {
      // Validate required fields
      if (!payload?.name) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Sub Policy name is required',
        };
      }

      if (!payload?.version) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Sub Policy version is required',
        };
      }

      if (!payload?.policyId) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Policy Id is required',
        };
      }

      // Check if Sub Policy already exists
      const existingDetails = await this.subPolicyModel.findOne({
        name: payload?.name,
        version: payload?.version,
      }).exec();

      if (existingDetails) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Sub Policy already exists',
        };
      }

      // Create and save new Sub Policy
      const subPolicy = new this.subPolicyModel(payload);
      const data = await subPolicy.save();

      return { data };
    } catch (error) {
      console.error('Error createSubPolicy:', error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async deleteById(payload: any): Promise<APIResponseInterface<any>> {
    try {
      // Validate if id is provided
      if (!payload?.id) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Sub Policy Id is required',
        };
      }

      // Attempt to delete Sub Policy by ID
      const result = await this.subPolicyModel.findByIdAndDelete(payload.id).exec();

      if (!result) {
        return {
          code: HttpStatus.NOT_FOUND,
          message: `Sub Policy with ID ${payload?.id} not found`,
        };
      }

      return {
        message: `Sub Policy with ID ${payload?.id} deleted successfully`,
      };
    } catch (error) {
      console.error('Error deleteById:', error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async findById(payload: any): Promise<APIResponseInterface<SubPolicy>> {
    try {
      // Validate if id is provided
      if (!payload?.id) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: 'Sub Policy Id is required',
        };
      }

      // Find Sub Policy by ID
      const subPolicyDetails = await this.subPolicyModel.findById(payload?.id).exec();

      if (!subPolicyDetails) {
        return {
          code: HttpStatus.NOT_FOUND,
          message: 'Sub Policy Not found',
        };
      }

      return { data: subPolicyDetails };
    } catch (error) {
      console.error('Error findById:', error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
