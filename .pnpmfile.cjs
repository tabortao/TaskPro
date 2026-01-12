function readPackage(pkg, context) {
  if (pkg.name === 'echarts-for-taro') {
    context.log('Blocked installation of echarts-for-taro');

    throw new Error('Restricted: The package "echarts-for-taro" does not exist. Please remove it and update the code referencing it.');
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
