import type { Types, UpdateQuery } from 'mongoose';
import { AppError } from '../../utils/AppError';
import type { UpdateProfileInput } from '../../validators/jobSeeker.validator';
import { User } from '../user/user.model';
import { JobSeekerProfile, type IJobSeekerProfile } from './jobSeeker.model';

export type Section = 'education' | 'experience' | 'projects';

const notFound = () => new AppError(404, 'Job seeker profile not found');
const entryNotFound = (section: Section) => new AppError(404, `${section} entry not found`);

const entriesOf = (profile: { toObject: () => unknown }, section: Section) =>
  (profile.toObject() as Record<Section, Array<{ _id: Types.ObjectId }>>)[section];

export const getProfile = async (userId: string) => {
  const profile = await JobSeekerProfile.findOne({ user: userId }).populate('user', 'name email role');
  if (!profile) throw notFound();
  return profile;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const { name, ...profileFields } = input;
  if (name) await User.updateOne({ _id: userId }, { $set: { name } });

  const profile = await JobSeekerProfile.findOneAndUpdate({ user: userId }, { $set: profileFields }, { new: true, runValidators: true });
  if (!profile) throw notFound();
  return getProfile(userId);
};

export const addEntry = async (userId: string, section: Section, data: Record<string, unknown>) => {
  const update = { $push: { [section]: data } } as UpdateQuery<IJobSeekerProfile>;
  const profile = await JobSeekerProfile.findOneAndUpdate({ user: userId }, update, { new: true, runValidators: true });
  if (!profile) throw notFound();
  const entries = entriesOf(profile, section);
  return entries[entries.length - 1];
};

export const updateEntry = async (userId: string, section: Section, entryId: string, data: Record<string, unknown>) => {
  const set = Object.fromEntries(Object.entries(data).map(([key, value]) => [`${section}.$.${key}`, value]));
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId, [`${section}._id`]: entryId },
    { $set: set } as UpdateQuery<IJobSeekerProfile>,
    { new: true, runValidators: true },
  );
  if (!profile) throw entryNotFound(section);
  return entriesOf(profile, section).find((e) => e._id.toString() === entryId);
};

export const removeEntry = async (userId: string, section: Section, entryId: string): Promise<void> => {
  const result = await JobSeekerProfile.updateOne(
    { user: userId, [`${section}._id`]: entryId },
    { $pull: { [section]: { _id: entryId } } } as UpdateQuery<IJobSeekerProfile>,
  );
  if (result.matchedCount === 0) throw entryNotFound(section);
};
