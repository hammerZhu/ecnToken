pragma solidity ^0.4.15;

import './Ownable.sol';
import './SafeMath.sol';
import './BasicToken.sol';
import './TokenHolder.sol';

/// @title Kin token contract.
contract EcnToken is Ownable, BasicToken, TokenHolder {
    using SafeMath for uint256;

    string public constant name = "Ecn";
    string public constant symbol = "ECN";

    // Using same decimal value as ETH (makes ETH-KIN conversion much easier).
    uint8 public constant decimals = 18;

    uint256 public constant max_coins =10**27;

    //construct function
    function EcnToken(){
        totalSupply=max_coins;
        balances[msg.sender]=totalSupply;
    }

}
