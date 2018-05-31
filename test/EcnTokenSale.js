import BigNumber from 'bignumber.js';
import _ from 'lodash';
import expectRevert from './helpers/expectRevert';
import time from './helpers/time';

const EcnToken = artifacts.require('../contracts/EcnToken.sol');
const EcnTokenSale = artifacts.require('../contracts/EcnTokenSale.sol');

// Before tests are run, 10 accounts are created with 10M ETH assigned to each.
// see scripts/ dir for more information.
contract('EcnTokenSale', (accounts) => {
    const MINUTE = 60;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const YEAR = 365 * DAY;

    let DEFAULT_GAS_PRICE = new BigNumber(100000000000);
    let GAS_COST_ERROR = process.env['SOLIDITY_COVERAGE'] ? 30000000000000000 : 0;

    const TOKEN_UNIT = 10 ** 18;

    // Maximum number of tokens in circulation.
    const MAX_TOKENS = new BigNumber(10 ** 13).mul(TOKEN_UNIT);

    // Maximum tokens sold here.
    const MAX_TOKENS_SOLD = new BigNumber(4300000000).mul(TOKEN_UNIT);

    const ECN_PER_WEI = 10000;



    let now;

    const increaseTime = async (by) => {
        await time.increaseTime(by);
        now += by;
    };


    // Get block timestamp.
    beforeEach(async () => {
        now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    });

    describe('construction', async () => {
        let fundRecipient = accounts[0];
        let sale;
        let token;
        beforeEach(async () => {
            token=await EcnToken.new();
        });
        it('should not allow to initialize with null token address', async () => {
            await expectRevert(EcnTokenSale.new(null,token));
        });
        it('should not allow to initialize with null funding recipient address', async () => {
            await expectRevert(EcnTokenSale.new(null,token));
        });

        it('should not allow to initialize with 0 funding recipient address', async () => {
            await expectRevert(EcnTokenSale.new(0, token));
        });

        it('should be initialized with 0 total sold tokens', async () => {
            let sale = await EcnTokenSale.new(fundRecipient, token.address);
            assert.equal((await sale.tokensSold()), 0);
        });

        it('should be ownable', async () => {
            let sale = await EcnTokenSale.new(fundRecipient,token.address);
            assert.equal(await sale.owner(), accounts[0]);
        });
    });

    describe('saleToken', async () => {
        let sale;
        let token;
        let end;
        let clientAccount=accounts[2];
        let fundRecipient = accounts[0];
        beforeEach(async () => {
            token = await EcnToken.new();
            sale = await EcnTokenSale.new(fundRecipient,token.address);
            end = (await sale.endTime()).toNumber();
            //there are 10000 token can be sale
            await token.approve(sale.address,MAX_TOKENS.toNumber(),{from:fundRecipient});
        });


        it('saling tokens successed', async () => {
            let tokenClientBeforeBuying=(await token.balanceOf(clientAccount)).toNumber();

            let ethOwnerBeforeBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            let tokenOwnerBeforeBuying=(await token.balanceOf(fundRecipient)).toNumber();
            let transWei=42000;
            let buyToken=transWei*ECN_PER_WEI;
            await sale.saleToken({from:clientAccount,value:transWei});
            let tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            assert.equal(tokenClientBeforeBuying+buyToken,tokenClientAfterBuying);
            let ethOwnerAfterBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            assert.equal(ethOwnerBeforeBuying+transWei,ethOwnerAfterBuying);
            let tokenOwnerAfterBuying=(await token.balanceOf(fundRecipient)).toNumber();
            assert.equal(tokenOwnerBeforeBuying,tokenOwnerAfterBuying+buyToken);
        });
        it('saling tokens are more than max token,there are max tokens saled. ', async () => {
            let tokenClientBeforeBuying=(await token.balanceOf(clientAccount)).toNumber();

            let ethOwnerBeforeBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            let transWei=44000*TOKEN_UNIT;
            let buyToken=transWei*ECN_PER_WEI;
            let recvWei=43000*TOKEN_UNIT;
            let buyResult=43000*TOKEN_UNIT*ECN_PER_WEI;
            await sale.saleToken({from:clientAccount,value:transWei});
            let tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            tokenClientAfterBuying=Math.round(tokenClientAfterBuying/TOKEN_UNIT);
            let token1=Math.round((tokenClientBeforeBuying+buyResult)/TOKEN_UNIT);
            assert.equal(token1,tokenClientAfterBuying);
            let ethOwnerAfterBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            //assert.equal(ethOwnerBeforeBuying+recvWei,ethOwnerAfterBuying);
            assert.isBelow(Math.abs(ethOwnerBeforeBuying+recvWei-ethOwnerAfterBuying),TOKEN_UNIT/10000);

        });
        it('saling tokens failed after endingTime', async () =>{
            increaseTime(91*DAY);
            let transWei=42000;
            await expectRevert(sale.saleToken({from:clientAccount,value:transWei}));
        });
    });
});


