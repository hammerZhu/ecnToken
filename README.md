# Ecn Token Contracts

Here be smart contracts for the [Ecn token][ecn token].

![Ecn Token](ecn.png)

Ecn is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.
It is envisioned as a general purpose cryptocurrency for use in everyday digital services such as chat, social media, and payments.
Ecn will be the unit of account for all economic transactions within the Ecn Ecosystem,
and it will serve as the basis of interoperability with other digital services.

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] and tested using [Truffle][truffle] and [testrpc][testrpc].

### Depenencies

```bash
# Install Truffle and testrpc packages globally:
$ npm install -g truffle ethereumjs-testrpc

# Install local node dependencies:
$ npm install
```

### Test

```bash
# Initialize a testrpc instance
$ ./scripts/testrpc.sh

# This will compile and test the contracts using truffle
$ truffle test

```

[ecn token]: https://ecn.tikteck.com
[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc

[docker compose]: https://docs.docker.com/compose/
