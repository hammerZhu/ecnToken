pragma solidity ^0.4.15;

import '../../contracts/EcnTokenSale.sol';

contract EcnTokenSaleMock is EcnTokenSale {
    function EcnTokenSaleMock(address _fundingRecipient,EcnToken _token)
        EcnTokenSale(_fundingRecipient,_token) {
    }

    function setTokensSold(uint256 _tokensSold) {
  	    tokensSold = _tokensSold;
    }

}
