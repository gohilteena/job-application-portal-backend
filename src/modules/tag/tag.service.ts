import { buildPagination, escapeRegex } from '../../utils/pagination';
import type { CreateTagInput, TagQuery } from '../../validators/tag.validator';
import { Tag } from './tag.model';

const toSlug = (name: string): string => name.toLowerCase().trim().replace(/\s+/g, '-');

export const listTags = async (query: TagQuery) => {
  const filter: Record<string, any> = {};
  if (query.appliesOn) filter.appliesOn = query.appliesOn;
  if (query.q) filter.name = new RegExp(escapeRegex(query.q), 'i');

  const [items, total] = await Promise.all([
    Tag.find(filter)
      .sort({ name: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Tag.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(query.page, query.limit, total) };
};

// Duplicate (slug + appliesOn) is rejected by the unique index and mapped to 409 centrally
export const createTag = (input: CreateTagInput, userId: string) =>
  Tag.create({ name: input.name, slug: toSlug(input.name), appliesOn: input.appliesOn, createdBy: userId });
