export const getAll = async (db, params) => {
  const offset = parseInt(params.offset || process.env.QUERY_PAGE_SIZE);
  let page = parseInt(params.page);
  if (page === 0) page = 1;
  let filteredObject = {};
  if (params.channel) filteredObject.channel = parseInt(params.channel);
  if (params.subChannel) filteredObject.subChannel = params.subChannel;
  if (params.templateId) filteredObject.templateId = params.templateId;
  const totalCount = await db.countDocuments(filteredObject);

  const data = await db
    .find(filteredObject)
    .skip(offset * (page - 1))
    .limit(offset)
    .toArray();

  return {
    data,
    totalCount
  };
};
