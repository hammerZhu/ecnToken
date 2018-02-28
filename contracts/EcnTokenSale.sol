pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Ownable.sol';
import './TokenHolder.sol';
import './EcnToken.sol';

/// @title Ecn token sale contract.
contract EcnTokenSale is Ownable, TokenHolder {
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
    uint256 public constant ECN_PER_WEI =10000;

    // Sale start and end timestamps.
    uint256 public constant SALE_DURATION = 14 days;
    uint256 public endTime;

    // Amount of tokens sold until now in the sale.
    uint256 public tokensSold = 0;


    event TokensIssued(address indexed _to, uint256 _tokens);

    /// @dev Reverts if called when not during sale.
    modifier onlyDuringSale() {
        require(now<=endTime);
       _;
    }


    /// @dev Constructor that initializes the sale conditions.
    /// @param _fundingRecipient address The address of the funding recipient.
    function EcnTokenSale(address _fundingRecipient,address _ecnToken) {
        require(_fundingRecipient != address(0));

        ecn = EcnToken(_ecnToken);

        fundingRecipient = _fundingRecipient;
        endTime = now+ SALE_DURATION;

    }


    /// @dev Fallback function that will delegate the request to saleToken().
    function saleToken() external payable onlyDuringSale {
        //Check wei received
        require(msg.value > 0);
        //ecn.transferFrom(owner,msg.sender,1000);
        uint256 restToken=ecn.balanceOf(fundingRecipient);
        uint256 tokenLeftInSale = SafeMath.min256(restToken,MAX_TOKENS_SOLD.sub(tokensSold));
        uint256 weiLeftInSale = tokenLeftInSale.div(ECN_PER_WEI);

        // Accept funds and transfer to funding recipient.
        uint256 weiToParticipate = SafeMath.min256(msg.value, weiLeftInSale);
        fundingRecipient.transfer(weiToParticipate);

        // Issue tokens and transfer to recipient.
        uint256 tokensToIssue = weiToParticipate.mul(ECN_PER_WEI);
        ecn.transferFrom(owner,msg.sender,tokensToIssue);
        TokensIssued(msg.sender,tokensToIssue);

        // Partial refund if full participation not possible
        // e.g. due to cap being reached.
        uint256 refund = msg.value.sub(weiToParticipate);
        if (refund > 0) {
            msg.sender.transfer(refund);
        }
    }

}

