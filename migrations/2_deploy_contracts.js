const SafeMath = artifacts.require('./SafeMath.sol');
const Ownable = artifacts.require('./Ownable.sol');

const EcnToken = artifacts.require('./EcnToken.sol');

module.exports = (deployer) => {
    deployer.deploy(SafeMath);
    deployer.deploy(Ownable);

    deployer.link(Ownable, EcnToken);
    deployer.link(SafeMath, EcnToken);

    deployer.deploy(EcnToken);
};
