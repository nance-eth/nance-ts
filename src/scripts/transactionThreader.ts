import { myProvider, sleep } from '../utils';
import { Nance } from '../nance';
import { getConfig } from '../configLoader';
import { NanceTreasury } from '../treasury';
import { TenderlyHandler } from '../tenderly/tenderlyHandler';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { keys } from '../keys';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance', key: keys.TENDERLY_KEY });
  // const simProvider = await tenderly.getForkProvider(`GC#41_${new Date().toISOString()}`);
  // const simURL = tenderly.getForkURL();
  const realTreasury = new NanceTreasury(config, nance.dProposalHandler, myProvider('mainnet'));
  const simTreasury = new NanceTreasury(config, nance.dProposalHandler, myProvider('mainnet'));
  const currentNonce = await GnosisHandler.getCurrentNonce(config.juicebox.gnosisSafeAddress, 'mainnet');
  await sleep(2000);

  // submit reconfig from payouts table to simulaiton
  const reconfig = await simTreasury.V3encodeReconfigureFundingCyclesOf();
  // await tenderly.sendTransaction(reconfig, config.juicebox.gnosisSafeAddress);
  // await tenderly.advanceTime(14 * 24 * 60 * 60);
  const futureDistribution = await simTreasury.juiceboxHandlerV3.getDistributionLimit();
  const distribution = await simTreasury.juiceboxHandlerV3.encodeDistributeFundsOf();
  // await tenderly.sendTransaction(distribution, config.juicebox.gnosisSafeAddress);
  
  // get payoput info
  const currentPayoutsList = (await nance.dProposalHandler.getPreviousPayoutsDb('V3', 40));
  const futurePayoutsList = (await nance.dProposalHandler.getPayoutsDb('V3'));

  const currentDistribution = await realTreasury.juiceboxHandlerV3.getDistributionLimit();
  const currentDistributionNum = Number(currentDistribution[0].toString())/10**18;
  const futureDistributionNum = Number(futureDistribution[0].toString())/10**18;
  const links = [
    { name: '🧱 Tenderly Simulation', value: 'https://dashboard.tenderly.co/jigglyjams/nance/fork/5cb6754c-dfdf-47f9-a160-ad4aff0d6046' },
    { name: '😵‍💫 Transaction Diff', value: 'https://jbdao.org/juicebox' },
    { name: '🗃 Juicebox Safe Diff', value: 'https://juicebox.money/@juicebox/safe'},
    { name: '', value: ''},
    { name: '✍️ Gnosis Transaction', value: 'https://app.safe.global/eth:0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e/transactions/tx?id=multisig_0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e_0x114a716b210ae246f38dc566f9c39df5a7d6ec0cadb88f37e31481e9b594aca1' },
    { name: '🔥 Den Transaction', value: 'https://app.onchainden.com/safes/eth:0xaf28bcb48c40dbc86f52d459a6562f658fc94b1e/transactions/0x114a716b210ae246f38dc566f9c39df5a7d6ec0cadb88f37e31481e9b594aca1' },
  ];
  
  // need to functionize!!
  const addPayouts = futurePayoutsList.filter((pay) => { 
    console.log(pay.payName, !currentPayoutsList.includes(pay));
    return !currentPayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
  });

  const removePayouts = currentPayoutsList.filter((pay) => { 
    return !futurePayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
  });
  // console.log(addPayouts.map((pay) => { return pay.payName }));
  // console.log(futurePayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log(currentPayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('added payouts');
  // console.log(addPayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('remove payouts');
  console.log(removePayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  nance.dialogHandler.sendTransactionSummary(addPayouts, removePayouts, currentDistributionNum, futureDistributionNum);
  // nance.dialogHandler.editTransactionMessage('1071474333521809579', links);
  // await nance.dialogHandler.createTransactionThread(currentNonce + 1, 'reconfigureV3', currentDistributionNum, futureDistributionNum, links);
}

main();
