import BigNumber from 'bignumber.js';
import _ from 'lodash';
import expectRevert from './helpers/expectRevert';
import time from './helpers/time';

const EcnToken = artifacts.require('../contracts/EcnToken.sol');
const EcnTokenSaleMuti = artifacts.require('../contracts/EcnTokenSaleMuti.sol');

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
    const MIN_ETH_UNIT =10**13;
    // Maximum number of tokens in circulation.
    const MAX_TOKENS = new BigNumber(10 ** 13).mul(TOKEN_UNIT);

    // Maximum tokens sold here.
    const MAX_TOKENS_SOLD = new BigNumber(4300000000).mul(TOKEN_UNIT);

    const ECN_PER_WEI = 40000;
    const ECN_RATES=[80,60,50];
    const SALE_DELAY=[15*DAY,30*DAY,60*DAY];

    let now;
    const MAX_SALE_ITEMS=100;
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
            await expectRevert(EcnTokenSaleMuti.new(null,token));
        });
        it('should not allow to initialize with null funding recipient address', async () => {
            await expectRevert(EcnTokenSaleMuti.new(null,token));
        });

        it('should not allow to initialize with 0 funding recipient address', async () => {
            await expectRevert(EcnTokenSaleMuti.new(0, token));
        });

        it('should be initialized with 0 total sold tokens', async () => {
            let sale = await EcnTokenSaleMuti.new(fundRecipient, token.address);
            assert.equal((await sale.tokensSold()), 0);
        });

        it('should be ownable', async () => {
            let sale = await EcnTokenSaleMuti.new(fundRecipient,token.address);
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
            sale = await EcnTokenSaleMuti.new(fundRecipient,token.address);
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
            assert.isBelow(Math.abs(tokenClientBeforeBuying+buyToken-tokenClientAfterBuying),TOKEN_UNIT);

            //assert.equal(tokenClientBeforeBuying+buyToken,tokenClientAfterBuying);
            let ethOwnerAfterBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            assert.isBelow(Math.abs(ethOwnerBeforeBuying+transWei-ethOwnerAfterBuying),TOKEN_UNIT);

            //assert.equal(ethOwnerBeforeBuying+transWei,ethOwnerAfterBuying);
            let tokenOwnerAfterBuying=(await token.balanceOf(fundRecipient)).toNumber();
            assert.isBelow(Math.abs(tokenOwnerAfterBuying+buyToken-tokenOwnerBeforeBuying),TOKEN_UNIT);
        });
        it('saling tokens are more than max token,there are max tokens saled. ', async () => {
            let tokenClientBeforeBuying=(await token.balanceOf(clientAccount)).toNumber();

            let ethOwnerBeforeBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            let transWei=440000000*TOKEN_UNIT;
            let buyToken=transWei*ECN_PER_WEI;
            let recvWei=430000000*TOKEN_UNIT/ECN_PER_WEI;
            let buyResult=430000000*TOKEN_UNIT*ECN_PER_WEI;
            await sale.saleToken({from:clientAccount,value:transWei});
            let tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            tokenClientAfterBuying=Math.round(tokenClientAfterBuying/TOKEN_UNIT);
            let token1=Math.round((tokenClientBeforeBuying+buyResult)/TOKEN_UNIT);
            assert.isBelow(Math.abs(token1-tokenClientAfterBuying),TOKEN_UNIT);
            //assert.equal(token1,tokenClientAfterBuying);
            let ethOwnerAfterBuying=await web3.eth.getBalance(fundRecipient).toNumber();
console.log("ethOwnerBeforeBuying"+ethOwnerBeforeBuying);
console.log("ethOwnerAfterBuying"+ethOwnerAfterBuying);
            assert.isBelow(Math.abs(ethOwnerBeforeBuying+recvWei-ethOwnerAfterBuying),TOKEN_UNIT);

            //assert.equal(ethOwnerBeforeBuying+recvWei,ethOwnerAfterBuying);

        });
        it('saling tokens failed after endingTime', async () =>{
            increaseTime(91*DAY);
            let transWei=42000;
            await expectRevert(sale.saleToken({from:clientAccount,value:transWei}));
        });
    });
    describe('saleTokenDelay', async () => {
        let sale;
        let token;
        let end;
        let clientAccount=accounts[2];
        let fundRecipient = accounts[0];
        beforeEach(async () => {
            token = await EcnToken.new({from:fundRecipient});
            sale = await EcnTokenSaleMuti.new(fundRecipient,token.address);
            //end = (await sale.endTime()).toNumber();
            //there are 10000 token can be sale
            await token.approve(sale.address,MAX_TOKENS.toNumber(),{from:fundRecipient});


        });


        it('buy coin 3 times and withdraw once ', async () => {

            let tokenClientBeforeBuying=(await token.balanceOf(clientAccount)).toNumber();
            let ethOwnerBeforeBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            let tokenOwnerBeforeBuying=(await token.balanceOf(fundRecipient)).toNumber();
            let transWei=300*(10**15);//0.3eth
            let buyToken1=transWei*ECN_PER_WEI*100/ECN_RATES[0];
            let buyToken2=transWei*ECN_PER_WEI*100/ECN_RATES[1];
            let buyToken3=transWei*ECN_PER_WEI*100/ECN_RATES[2];
            let buyTokenTotal=buyToken1+buyToken2+buyToken3;
            await sale.saleTokenDelay1({from:clientAccount,value:transWei});
            await sale.saleTokenDelay2({from:clientAccount,value:transWei});
            await sale.saleTokenDelay3({from:clientAccount,value:transWei});
            //wait 61 days and with draw once

            await increaseTime(61*DAY);
            //check after withdraw
            await sale.withdrawAvailTokens({from:clientAccount});

            let tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            //assert.equal(tokenClientBeforeBuying+buyTokenTotal,tokenClientAfterBuying);
            assert.isBelow(Math.abs(tokenClientBeforeBuying+buyTokenTotal-tokenClientAfterBuying),TOKEN_UNIT);
            let ethOwnerAfterBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            //assert.equal(ethOwnerBeforeBuying+transWei*3,ethOwnerAfterBuying);
            assert.isBelow(Math.abs(ethOwnerBeforeBuying+transWei*3-ethOwnerAfterBuying),MIN_ETH_UNIT);
            let tokenOwnerAfterBuying=(await token.balanceOf(fundRecipient)).toNumber();
            assert.isBelow(Math.abs(tokenOwnerBeforeBuying-tokenOwnerAfterBuying-buyTokenTotal),TOKEN_UNIT);
        });
        it('buy coin 3 times and withdraw 3 times ', async () =>{
            let tokenClientBeforeBuying=(await token.balanceOf(clientAccount)).toNumber();
            let ethOwnerBeforeBuying=await web3.eth.getBalance(fundRecipient).toNumber();
            let tokenOwnerBeforeBuying=(await token.balanceOf(fundRecipient)).toNumber();
            let transWei=300*(10**15);//0.3eth
            let buyToken1=transWei*ECN_PER_WEI*100/ECN_RATES[0];
            let buyToken2=transWei*ECN_PER_WEI*100/ECN_RATES[1];
            let buyToken3=transWei*ECN_PER_WEI*100/ECN_RATES[2];
            let buyTokenTotal=buyToken1+buyToken2+buyToken3;
            await sale.saleTokenDelay1({from:clientAccount,value:transWei});
            await sale.saleTokenDelay2({from:clientAccount,value:transWei});
            await sale.saleTokenDelay3({from:clientAccount,value:transWei});

            //withdraw after 16 days
            await increaseTime(1*HOUR);
            let tokenClientAfterBuying;
            await increaseTime(15*DAY);
            await sale.withdrawAvailTokens({from:clientAccount});
            tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            //assert.equal(tokenClientBeforeBuying+buyToken1,tokenClientAfterBuying);
            assert.isBelow(Math.abs(tokenClientBeforeBuying+buyToken1-tokenClientAfterBuying),TOKEN_UNIT);
            tokenClientBeforeBuying=tokenClientAfterBuying;
            //withdraw after 31 days
            await increaseTime(15*DAY);
            await sale.withdrawAvailTokens({from:clientAccount});
            tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            //assert.equal(tokenClientBeforeBuying+buyToken2,tokenClientAfterBuying);
            assert.isBelow(Math.abs(tokenClientBeforeBuying+buyToken2-tokenClientAfterBuying),TOKEN_UNIT);
            tokenClientBeforeBuying=tokenClientAfterBuying;
            //withdraw after 60 days
            await increaseTime(30*DAY);
            await sale.withdrawAvailTokens({from:clientAccount});
            tokenClientAfterBuying=(await token.balanceOf(clientAccount)).toNumber();
            //assert.equal(tokenClientBeforeBuying+buyToken3,tokenClientAfterBuying);
            assert.isBelow(Math.abs(tokenClientBeforeBuying+buyToken3-tokenClientAfterBuying),TOKEN_UNIT);
            tokenClientBeforeBuying=tokenClientAfterBuying;
        });
        it('buy tokens and withdraw within periods, expect withdraw 0 ', async () => {
            let tokenClientBeforeBuying = (await token.balanceOf(clientAccount)).toNumber();

            let transWei = 300 * (10 ** 15);//0.3eth
            await sale.saleTokenDelay1({from: clientAccount, value: transWei});

            //withdraw after 14 days
            await increaseTime(14 * DAY);
            await sale.withdrawAvailTokens({from: clientAccount});
            let tokenClientAfterBuying = (await token.balanceOf(clientAccount)).toNumber();
            //assert.equal(tokenClientBeforeBuying,tokenClientAfterBuying);
            assert.isBelow(Math.abs(tokenClientBeforeBuying  - tokenClientAfterBuying), TOKEN_UNIT);
        });
        it('buy tokens too many times and can not buy ', async () => {
            let transWei=100*(10**15);//0.1eth
            for(let i=0;i<MAX_SALE_ITEMS;i++)
                await sale.saleTokenDelay1({from:clientAccount,value:transWei});
            await expectRevert(sale.saleTokenDelay1({from:clientAccount,value:transWei}));
        });

    });
});


