import expectRevert from './helpers/expectRevert';

const EcnToken = artifacts.require('../contracts/EcnToken.sol');

contract('EcnToken', (accounts) => {
    let token;

    let owner = accounts[0];
    let spender = accounts[1];

    const token_unit=10**18;
    let allowedAmount = 100;  // Spender allowance
    let transferredFunds = 1200;  // Funds to be transferred around in tests

    beforeEach(async () => {
        token = await EcnToken.new();
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await token.owner(), owner);
        });

        it('should return correct name after construction', async () => {
            assert.equal(await token.name(), 'Ecn');
        });

        it('should return correct symbol after construction', async () => {
            assert.equal(await token.symbol(), 'ECN');
        });

        it('should return correct decimal points after construction', async () => {
            assert.equal(await token.decimals(), 18);
        });

        it('should return correct supply after construction', async () => {
            assert.equal(await token.totalSupply(), 10**9*token_unit);
        });
    });
});
