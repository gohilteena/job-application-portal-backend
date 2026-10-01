import { AppError } from '../../utils/AppError';
import type { CompanyInput, UpdateRecruiterInput } from '../../validators/recruiter.validator';
import { Company } from '../company/company.model';
import { User } from '../user/user.model';
import { RecruiterProfile } from './recruiter.model';

const notFound = () => new AppError(404, 'Recruiter profile not found');

export const getProfile = async (userId: string) => {
  const profile = await RecruiterProfile.findOne({ user: userId }).populate('user', 'name email role').populate('company');
  if (!profile) throw notFound();
  return profile;
};

export const updateProfile = async (userId: string, input: UpdateRecruiterInput) => {
  const { name, ...fields } = input;
  if (name) await User.updateOne({ _id: userId }, { $set: { name } });
  const updated = await RecruiterProfile.findOneAndUpdate({ user: userId }, { $set: fields }, { new: true, runValidators: true });
  if (!updated) throw notFound();
  return getProfile(userId);
};

/** Update the recruiter's company, creating it on first use (name required then). */
export const upsertCompany = async (userId: string, input: CompanyInput) => {
  const profile = await RecruiterProfile.findOne({ user: userId });
  if (!profile) throw notFound();

  if (profile.company) {
    const company = await Company.findByIdAndUpdate(profile.company, { $set: input }, { new: true, runValidators: true });
    if (company) return company;
  }

  if (!input.name) {
    throw new AppError(400, 'Validation failed', [{ field: 'name', message: 'Company name is required when creating a company' }]);
  }
  const company = await Company.create({ ...input, name: input.name, createdBy: userId });
  profile.company = company._id;
  await profile.save();
  return company;
};
