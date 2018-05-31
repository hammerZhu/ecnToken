// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

//import {default as keythereum} from 'keythereum';
var Tx = require('ethereumjs-tx');
// Import our contract artifacts and turn them into usable abstractions.
import ecncoin_artifacts from '../../build/contracts/EcnToken.json';
import ecnsale_artifacts from '../../build/contracts/EcnTokenSaleMuti.json';

import keyJson from '../../cdata/keystore/key8808.json';
"use strict";

// EcnCoin is our usable abstraction, which we'll use through the code below.
var EcnCoin = contract(ecncoin_artifacts);
var EcnSale = contract(ecnsale_artifacts);
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;//current account
var myAccount;//user input key

var ecnTokenContractInstance;
var ecnSaleContractInstance;


var WSAccounts;
var WSAccount;

window.App = {

    start:  async function() {
        var self = this;

        // Bootstrap the MetaCoin abstraction for Use.
        EcnCoin.setProvider(web3.currentProvider);
        EcnSale.setProvider(web3.currentProvider);
        // Get the initial account balance so it can be displayed.
        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                alert("There was an error fetching your accounts.");
                return;
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                return;
            }

            accounts = accs;
            account = accounts[0];

            //await self.getContact();
            //await self.refreshAccount();
        });
        //myAccount=web3.eth.accounts.decrypt(keyJson, '123456');
    /*    myAccount=web3.eth.accounts.decrypt(keyJson, 'KEE2014teck');
        console.log(myAccount);
        var secondAccount=web3.eth.accounts.privateKeyToAccount(myAccount.privateKey);
        console.log("secondAccount address=");
        console.log(secondAccount);
        //update address
        var address_element = document.getElementById("user_account");
        address_element.innerHTML = myAccount.address;

        //更新以太币显示
        var eth_balance=await web3.eth.getBalance(myAccount.address);
        if(eth_balance!=null)
        {
            var eth_element = document.getElementById("ethcoin");
            eth_element.innerHTML = eth_balance.valueOf();
        }
        else{
            self.setStatus("Error getting ethcoin; see log.");
        }*/
        console.log('ecnTokenContractInstance=');
        var abi=EcnCoin.abi;
        ecnTokenContractInstance=new web3.eth.Contract(abi,'0x8c862ce5d296c638e2c9df16ef208dff9265c0ec');
        console.log(ecnTokenContractInstance);
        self.refreshBalance();
    },

    setStatus: function(message) {
        var status = document.getElementById("status");
        status.innerHTML = message;
    },
    //deploy contract。
    deployEcnToken: function(){
        var self=this;

        //deploy ecnToken contract
        console.log('now deploy ecnToken contract');

            var EcnContract = new web3.eth.Contract(ecncoin_artifacts.abi);
            EcnContract.deploy({
                data: ecncoin_artifacts.unlinked_binary
            })
                .send({
                    from: account,
                    gas: 3500000,
                    gasPrice: '10000000000'
                }, function(error, transactionHash){
                 })
                .on('error', function(error){
                    console.log('error');
                    console.log(error);
                 })
                .on('transactionHash', function(transactionHash){
                    console.log('transactionHash');
                    console.log(transactionHash);
                 })
                .on('receipt', function(receipt){
                    console.log('receipt');
                    console.log(receipt.contractAddress) // contains the new contract address
                })
                .on('confirmation', function(confirmationNumber, receipt){
                    //console.log('confirmation');
                    //console.log(confirmationNumber);
                 })
                .then(function(newContractInstance){
                    console.log(newContractInstance.options.address)// instance with the new contract address
                    ecnTokenContractInstance=newContractInstance;
                    self.refreshBalance();
                    self.deployEcnSale(newContractInstance.options.address);
                    //测试转账函数
                    /*var saleValue=web3.utils.toBN(web3.utils.toWei('500','ether')).toString();
                    ecnTokenContractInstance.methods.transfer(accounts[1],saleValue).send({from:account,gas: 3500000,
                        gasPrice: '10000000000'},function(err,result){
                        if(!err){
                            console.log('transfer result='+result);
                            console.log()
                        }
                        else{
                            console.log('transfer error');
                            console.log(err);
                        }
                    });*/
                });

    },
    //deploy contract。
    deployEcnCryptToken: async function(){
        var self=this;

        //deploy ecnToken contract
        console.log('now deploy ecnToken contract');

        var EcnContract = new web3.eth.Contract(ecncoin_artifacts.abi,myAccount.address,{gas: 3500000,gasPrice: '10000000000'});
        //var EcnContract = new web3.eth.Contract(ecncoin_artifacts.abi);
        var DeployTrans=EcnContract.deploy({
            data: ecncoin_artifacts.unlinked_binary
        });
        console.log('DeployTrans');
        console.log(DeployTrans);


        var transAccount=await web3.eth.accounts.privateKeyToAccount(myAccount.privateKey);
        console.log("transAccount address=");
        console.log(transAccount);
        console.log('DeployCryptTrans rawTransaction =');
        var DeployCryptTrans= await web3.eth.accounts.signTransaction({
            gasPrice: '20000000000',
            gas: '3500000',
            //data:DeployTrans._deployData
            value:'1000000000000000',
            to:'0x8c9887ee7e3c4711409be2dacf512cd256093bcc',
            data:''
        },transAccount.privateKey);
        console.log(DeployCryptTrans.rawTransaction);
        /*console.log('DeployCryptTrans raw =');
        //使用这个函数需要解锁账号，不能用。
        var DeployCryptTrans2=await web3.eth.signTransaction({
            from:'0xc191d52309d5009901dc004c0f63fee1b49a6b0d',
            gasPrice: '20000000000',
            gas: '3500000',
            //data:DeployTrans._deployData
            value:'1000000000000000',
            to:'0x8c9887ee7e3c4711409be2dacf512cd256093bcc',
            data:""
        },'0xc191d52309d5009901dc004c0f63fee1b49a6b0d');


        console.log(DeployCryptTrans2.raw);*/
       /* var rawTx = {
            gasPrice: '20000000000',
            gas: 3500000,
            data: DeployTrans._deployData
        }

        var tx = new Tx(rawTx);
        var privateKey = new Buffer(myAccount.privateKey);

        tx.sign(privateKey);
        var serializedTx = tx.serialize();

        console.log(serializedTx.toString('hex'));
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('error', function(error){
            console.log('error');
            console.log(error);
            })
            .on('receipt', function(receipt){
                console.log('receipt');
                console.log(receipt.contractAddress) // contains the new contract address
            });
         */


        web3.eth.sendSignedTransaction(DeployCryptTrans.rawTransaction,function(error, transactionHash){
            })
            .on('error', function(error){
                console.log('error');
                console.log(error);
            })
            .on('transactionHash', function(transactionHash){
                console.log('transactionHash');
                console.log(transactionHash);
            })
            .on('receipt', function(receipt){
                console.log('receipt');
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function(confirmationNumber, receipt){
                //console.log('confirmation');
                //console.log(confirmationNumber);
            })
            .then(function(newContractInstance){
                console.log(newContractInstance.options.address)// instance with the new contract address
                ecnTokenContractInstance=newContractInstance;
                self.refreshBalance();
                //self.deployEcnSale(newContractInstance.options.address);
                //测试转账函数

            });

    },
    deployEcnSale: function(tokenAddress){
        var self=this;

        //deploy ecnToken contract
        console.log('now deploy ecnTokenSale contract');
        if(!web3.utils.isAddress(tokenAddress)){
            console.log('ecntoken address error');
            return;
        }
        var EcnSaleContract = new web3.eth.Contract(ecnsale_artifacts.abi);
        EcnSaleContract.deploy({
            data: ecnsale_artifacts.unlinked_binary,
            arguments: [account, tokenAddress]
        })
            .send({
                from: account,
                gas: 3500000,
                gasPrice: '10000000000'
            }, function(error, transactionHash){
            })
            .on('error', function(error){
                console.log(' EcnSaleContract error');
                console.log(error);
            })
            .on('transactionHash', function(transactionHash){
                console.log('EcnSaleContract transactionHash');
                console.log(transactionHash);
            })
            .on('receipt', function(receipt){
                console.log('EcnSaleContract receipt');
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function(confirmationNumber, receipt){
                //console.log('confirmation');
                //console.log(confirmationNumber);
            })
            .then(function(newContractInstance){
                console.log('EcnSaleContract deploy success address=');
                console.log(newContractInstance.options.address) // instance with the new contract address
                ecnSaleContractInstance=newContractInstance;
                //approval ecn sale
                var approvalValue=new web3.utils.BN(200000000);
                var approvalWei=web3.utils.toWei(approvalValue,'ether');
                ecnTokenContractInstance.methods.approve(newContractInstance.options.address,approvalWei).send({from:account},function(err,result){
                    if(!err){
                        console.log('approval ecnSaleContractInstance success');
                    }
                    else{
                        console.log('approval ecnSaleContractInstance failed');
                        console.log(err);
                    }
                });
            });
    },
    //update account address and eth
    refreshAccount:async function(){
        var self = this;
        //update address
        var address_element = document.getElementById("user_account");
        address_element.innerHTML = account;
        //更新以太币显示
        var eth_balance=await web3.eth.getBalance(account);
        if(eth_balance!=null)
        {
            var eth_element = document.getElementById("ethcoin");
            eth_element.innerHTML = eth_balance.valueOf();
        }
        else{
            self.setStatus("Error getting ethcoin; see log.");
        }
    },
    //update ecn tokens of current account
    refreshBalance: async function() {
    if(ecnTokenContractInstance==undefined){
        console.log("ecnTokenContractInstance is undefined!");
        return;
    }

        var self = this;
    // call constant function

        var balanceValue= await ecnTokenContractInstance.methods.balanceOf(account).call();
        if(balanceValue!=null)
        {
            var tokenVal=web3.utils.fromWei(balanceValue.valueOf(),'ether');
            var balance_element = document.getElementById("balance");
            balance_element.innerHTML = tokenVal;
        }
        else{
            self.setStatus("Error getting balance; see log.");
        }
    },
    buyCoin: async function(){
        var self=this;
        //call buy coin functions
        try{
            var ethValue=web3.utils.toWei('100','finney');
            await ecnSaleContractInstance.methods.saleToken().send({from:account,value:ethValue});
            self.refreshBalance();
        }
        catch(err){
            console.log('buyCoin error');
            console.log(err);
        }
    },
    sendCoin: function() {
        var self = this;
    
        var amount = parseInt(document.getElementById("amount").value);
        var receiver = document.getElementById("receiver").value;
        var amountWei=web3.utils.toWei(amount.toString(),'ether');
        this.setStatus("Initiating transaction... (please wait)");

        ecnTokenContractInstance.methods.transfer(receiver, amountWei).send({from: account},function(err, result){
            if(err){
                console.log(err);
                self.setStatus("Error sending coin; see log.");
            }
            else{
                self.setStatus("Transaction complete!");
                self.refreshBalance();
            }
        });

    },
    changeAccount: function(){
        var self = this;
        var recvAccount=document.getElementById("account_input").value;
        console.log("recvAccount"+recvAccount);
        //check account available
        if(web3.utils.isAddress()){
            console.log('account inputed is not a valid account');
            return;
        }
        account=recvAccount;
        self.refreshBalance();
        //todo 把当前帐号换成指定的帐号，并刷新。
       /* var findOk=false;
        //轮流读取帐号，直到指定的帐号
        for(var j=0;j<accounts.length;j++){
            if(recvAccount==accounts[j]){
                account = accounts[j];
                findOk=true;
                break;
            }
        }
        console.log("findOk="+findOk);
        if(findOk){//提示用户帐号已改变，同时更新余额
            window.alert("Change account success!");
            self.refreshBalance();
        }
        else{//弹出提示框提示用户帐号不对。
            window.alert("The account is not found!");
        }*/
    }
};

window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        //window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/A9EikCBidg0zTuOVcxlL"));
    }
    App.start();
});
