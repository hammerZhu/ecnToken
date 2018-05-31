pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Ownable.sol';
import './TokenHolder.sol';
import './EcnToken.sol';

/// @title Ecn token sale contract.
contract EcnTokenSaleMulti is Ownable, TokenHolder {
    using SafeMath for uint256;

    // ECN token contract.
    EcnToken public ecn;

    // Received funds are forwarded to this address.
    address public fundingRecipient;

    // Using same decimal value as ETH (makes ETH-ECN conversion much easier).
    // This is the same as in Ecn token contract.
    uint256 public constant TOKEN_UNIT = 10 ** 18;

    // Maximum number of tokens in circulation: 10 trillion.
    uint256 public constant MAX_TOKENS = 10 ** 9 * TOKEN_UNIT;

    uint256 public constant MAX_TOKENS_SOLD = 430000000*TOKEN_UNIT;
    // ECN to 1 wei ratio.
    uint256 public constant ECN_PER_WEI = 40000;

    // Sale start and end timestamps.
    uint256 public constant SALE_DURATION = 90 days;
    uint256 public endTime;

    // Amount of tokens sold until now in the sale.
    uint256 public tokensSold = 0;


    // delay sale
    struct Grant {
            address user;//address of user
            uint256 value;//coins of user buying
            uint timeAvail;// time of translating to user account
    }

    uint grantIndex;
    uint constant MAX_NUM_OF_SALEITEM = 100;
    Grant[100] saleItem;

    uint[3] saleRates;
    uint[3] saleDelays;

    event TokensIssued(address indexed _to, uint256 _tokens);
    event TokenSaleDelay(address _to, uint256 _token, uint256 _avail);

    /// @dev Reverts if called when not during sale.
    modifier onlyDuringSale() {
        require(now <= endTime);
       _;
    }

    /// @dev Constructor that initializes the sale conditions.
    /// @param _fundingRecipient address The address of the funding recipient.
    /// @param   _ecnToken address of the existed ecnToken .
    function EcnTokenSaleMulti(address _fundingRecipient, address _ecnToken) {
        require(_fundingRecipient!=0 && _ecnToken!=0);

        fundingRecipient = _fundingRecipient;
        ecn = EcnToken(_ecnToken);

        endTime = now + SALE_DURATION;

        for(uint i = 0; i < MAX_NUM_OF_SALEITEM; i ++){
            saleItem[i].value = 0;
        }
        saleRates[0] = 80;//pencents of ECN_PER_WEI
        saleRates[1] = 60;
        saleRates[2] = 50;
        saleDelays[0] = 15 days;
        saleDelays[1] = 30 days;
        saleDelays[2] = 60 days;

    }
    /// @dev get token can be saled.
    /// @return uint256 tokens.
    //function checkTokenCanSaled() constant returns (uint256){
    function tokenLeftInSale() constant returns (uint256){
        uint256 restToken = ecn.balanceOf(fundingRecipient);
        uint256 allowToken = SafeMath.min256(restToken, ecn.allowance(owner, this));
        uint256 tokenLeft = SafeMath.min256(allowToken, MAX_TOKENS_SOLD.sub(tokensSold));
        return tokenLeft;
    }

    /// @dev receive wei and caculate token saled.
    /// @return tokens will be transfered.
    function receiveWei(address _buyer, uint256 _value, uint _rate) private returns (uint256){
        uint256 tokenLeft = tokenLeftInSale();
        uint256 weiLeftInSale = tokenLeft.div(_rate);

        // Accept funds and transfer to funding recipient.
        uint256 weiToParticipate = SafeMath.min256(_value, weiLeftInSale);
        fundingRecipient.transfer(weiToParticipate);

        // Partial refund if full participation not possible
         // e.g. due to cap being reached.
         uint256 refund = _value.sub(weiToParticipate);
         if (refund > 0) {
              _buyer.transfer(refund);
         }
         // Issue tokens and transfer to recipient.
         uint256 tokensToIssue = weiToParticipate.mul(_rate);
         return tokensToIssue;
    }

    /// @dev Fallback function that will delegate the request to saleToken().
    function saleToken() external payable onlyDuringSale {
        //Check wei received
        require(msg.value > 0);

        uint256 tokensToIssue = receiveWei(msg.sender, msg.value, ECN_PER_WEI);
        ecn.transferFrom(owner, msg.sender, tokensToIssue);
        TokensIssued(msg.sender, tokensToIssue);

    }
    /// @dev saling tokens at discount 1
    function saleTokenDelay1() external payable onlyDuringSale{
        saleTokenDelay(msg.sender, msg.value, 0);
    }

    /// @dev saling tokens at discount 2
    function saleTokenDelay2() external payable onlyDuringSale{
            saleTokenDelay(msg.sender, msg.value, 1);
    }

    /// @dev saling tokens at discount 3
    function saleTokenDelay3() external payable onlyDuringSale{
            saleTokenDelay(msg.sender, msg.value, 2);
    }

    /// @dev saling tokens at discount
    /// @param buyer the address of buyer .
    /// @param value weis receive from buyer.
    /// @param delayPeriod which discount to be used, form 0 to 2.
    function saleTokenDelay(address buyer, uint256 value, uint delayPeriod) private {
        //check wei received and tokens left
        require(value > 10**16);//0.01eth min
        uint rateBuying = ECN_PER_WEI * 100 / saleRates[delayPeriod];

        //find a blank item
         uint blankIndex = MAX_NUM_OF_SALEITEM;
         for(uint i = 0;i < MAX_NUM_OF_SALEITEM; i ++){
             if(0 == saleItem[i].value){
                 blankIndex = i;
                 break;
             }
         }
         require(blankIndex < MAX_NUM_OF_SALEITEM);

         uint256 tokensToIssue = receiveWei(buyer, value, rateBuying);

         saleItem[blankIndex].user = buyer;
         saleItem[blankIndex].value = tokensToIssue;
         saleItem[blankIndex].timeAvail = now + saleDelays[delayPeriod];

         TokenSaleDelay(buyer, tokensToIssue, saleItem[blankIndex].timeAvail);
   }

    /// @dev get tokens can be withdrawed.
    /// @return tokens can be withdrawed for current buyer.
    function checkAvailTokens() constant returns (uint256){
        uint256 totalTokens = 0;
        for(uint i = 0; i < MAX_NUM_OF_SALEITEM; i ++){
            if(saleItem[i].value>0  && now > saleItem[i].timeAvail && saleItem[i].user == msg.sender){
                totalTokens = totalTokens.add(saleItem[i].value);
            }
        }
        return totalTokens;
    }

    /// @dev buyer withdraw tokens to their account.
    function withdrawAvailTokens() external{
        uint256 restToken = ecn.allowance(owner, this);
        uint256 totalTokens = 0;
        for(uint i = 0; i < MAX_NUM_OF_SALEITEM; i++){
            if(saleItem[i].value > 0  && now > saleItem[i].timeAvail && saleItem[i].user == msg.sender){

                if(totalTokens.add(saleItem[i].value) < restToken){
                    totalTokens = totalTokens.add(saleItem[i].value);
                    saleItem[i].value = 0;
                }
                else
                    break;
            }
        }
        if(totalTokens > 0){
            ecn.transferFrom(owner, msg.sender, totalTokens);
        }
    }
}