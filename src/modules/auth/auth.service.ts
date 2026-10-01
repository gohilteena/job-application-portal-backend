import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import type { Role } from '../../types';
import { AppError } from '../../utils/AppError';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import type { LoginInput, RegisterInput } from '../../validators/auth.validator';
import { JobSeekerProfile } from '../jobSeeker/jobSeeker.model';
import { RecruiterProfile } from '../recruiter/recruiter.model';
import { User } from '../user/user.model';

const MAX_SESSIONS = 5;

const publicUser = (u: { id: string; name: string; email: string; role: Role }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

const issueTokens = async (id: string, role: Role) => {
  const accessToken = signAccessToken({ id, role });
  const refreshToken = signRefreshToken({ id, role });
  await User.updateOne(
    { _id: id },
    { $push: { refreshTokens: { $each: [hashToken(refreshToken)], $slice: -MAX_SESSIONS } } },
  );
  return { accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  if (await User.exists({ email: input.email })) throw new AppError(409, 'Email is already registered');

  const password = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name: input.name, email: input.email, password, role: input.role });

  try {
    if (input.role === 'job_seeker') await JobSeekerProfile.create({ user: user._id });
    else await RecruiterProfile.create({ user: user._id });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // don't leave a user without a profile
    throw err;
  }

  const tokens = await issueTokens(user.id, user.role);
  return { user: publicUser(user), ...tokens };
};

export const login = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    throw new AppError(401, 'Invalid email or password');
  }
  const tokens = await issueTokens(user.id, user.role);
  return { user: publicUser(user), ...tokens };
};

export const refresh = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const hash = hashToken(refreshToken);

  // Atomically consume the token (rotation): a token can only be used once
  const user = await User.findOneAndUpdate({ _id: payload.id, refreshTokens: hash }, { $pull: { refreshTokens: hash } });
  if (!user) {
    // Valid signature but unknown token => likely reuse of a rotated/revoked token: revoke all sessions
    await User.updateOne({ _id: payload.id }, { $set: { refreshTokens: [] } });
    throw new AppError(401, 'Refresh token is invalid or has already been used. Please log in again');
  }

  const tokens = await issueTokens(user.id, user.role);
  return { user: publicUser(user), ...tokens };
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await User.updateOne({ _id: payload.id }, { $pull: { refreshTokens: hashToken(refreshToken) } });
  } catch {
    /* logout is idempotent: an invalid/expired token is already unusable */
  }
};
