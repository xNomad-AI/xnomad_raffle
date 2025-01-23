import * as fs from 'fs';
import keccak256 from 'keccak256';
import whitelist from './common/whitelist.js';
import allUserDeposits from './common/deposits.js';

interface RaffleModel {
    address: string,
    depositAmount: string,
    timestamp: number,
}

interface Deposit {
    nftAmount: number;
    depositAmount: string; // Hexadecimal string
    timestamp: string; // Hexadecimal string
}

interface Account {
    user: string; // Public key as a string
    totalNftAmount: number; // Total number of NFTs
    totalDepositAmount: string; // Hexadecimal string
    vault: string; // Public key as a string
    deposits: Deposit[]; // Array of Deposit objects
}

interface DepositData {
    publicKey: string; // Public key as a string
    account: Account; // Nested account object
}

const totalSupply = 5000;
let randomSeed = 'xnomad';

async function main() {
    const { publicUserDeposits, whitelistUserDeposits } = filterDeposits(allUserDeposits, whitelist);
    const winners: any[] = [];

    const pubAndWLUserDeposits = [whitelistUserDeposits, publicUserDeposits];

    for (const userDeposits of pubAndWLUserDeposits) {
        const raffles = prepareRaffles(userDeposits);
        const sortedGroups = convertAndSort(groupByDepositAmount(raffles));

        for (const group of sortedGroups) {
            if (group.raffles.length <= totalSupply - winners.length) {
                group.raffles.forEach(raffle => winners.push(createWinner(raffle, winners.length)));
            } else {
                selectWinnersByRaffle(randomSeed, group.raffles, winners, totalSupply);
            }
        }
    }

    writeJsonToFile('./src/result/airdrop.json', winners);

    const raffleResults = calculateRaffleResults(allUserDeposits, whitelist, winners);
    writeJsonToFile('./src/result/raffle_results.json', raffleResults);
}

// write json file
const writeJsonToFile = (filePath: string, jsonData: any) => {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        fs.writeFileSync(filePath, jsonString, 'utf-8');
        console.log(`JSON data successfully written to ${filePath}`);
    } catch (error) {
        console.error("Error writing JSON to file:", error);
    }
};

// filter whitelist and public user deposit
const filterDeposits = (deposits: DepositData[], whitelist: string[]) => {
    const publicUserDeposits = deposits.filter(d => !whitelist.includes(d.account.user));
    const whitelistUserDeposits = deposits.filter(d => whitelist.includes(d.account.user));
    return { publicUserDeposits, whitelistUserDeposits };
};

// ready raffle
const prepareRaffles = (userDeposits: DepositData[]): RaffleModel[] => {
    let raffles: RaffleModel[] = [];
    for (const userDeposit of userDeposits) {
        userDeposit.account.deposits.forEach(deposit => {
            raffles.push({
                address: userDeposit.account.user,
                depositAmount: BigInt('0x' + deposit.depositAmount).toString(10),
                timestamp: parseInt(deposit.timestamp, 16)
            });
        });
    }
    return raffles.sort((a, b) => a.timestamp - b.timestamp);
};

// create winner
const createWinner = (raffle: RaffleModel, tokenId: number) => {
    return {
        ownerAddress: raffle.address,
        depositAmount: raffle.depositAmount,
        tokenId: tokenId + 1,
        timestamp: raffle.timestamp,
    };
};

// group by deposit amount
const groupByDepositAmount = (raffles: RaffleModel[]): Record<string, RaffleModel[]> => {
    return raffles.reduce((acc, raffle) => {
        if (!acc[raffle.depositAmount]) {
            acc[raffle.depositAmount] = [];
        }
        acc[raffle.depositAmount].push(raffle);
        return acc;
    }, {} as Record<string, RaffleModel[]>);
};

// sory by deposit amount
const convertAndSort = (groupedRaffles: Record<string, RaffleModel[]>) => {
    return Object.entries(groupedRaffles)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(([depositAmount, raffles]) => ({ depositAmount, raffles }));
};

// raffle
const selectWinnersByRaffle = (seed: string, raffles: RaffleModel[], winners: any[], totalSupply: number) => {
    const maxRaffleId = raffles.length;
    const selectedWinnerIds = new Set<number>();

    while (winners.length < totalSupply) {
        seed = '0x' + keccak256(seed).toString('hex');
        const winnerId = Number(BigInt(seed) % BigInt(maxRaffleId));
        if (!selectedWinnerIds.has(winnerId)) {
            selectedWinnerIds.add(winnerId);
            winners.push(createWinner(raffles[winnerId], winners.length));
        }
    }
    randomSeed = seed;
};

// calculate result
const calculateRaffleResults = (deposits: DepositData[], whitelist: string[], winners: any[]) => {
    const depositMap = new Map<string, number>();
    const refundMap = new Map<string, number>();
    const winTokenMap = new Map<string, number>();

    deposits.forEach(userDeposit => {
        const user = userDeposit.account.user;
        depositMap.set(user, parseInt(userDeposit.account.totalDepositAmount, 16));
        userDeposit.account.deposits.forEach(deposit => {
            const currentRefund = refundMap.get(user) || 0;
            refundMap.set(user, currentRefund + parseInt(deposit.depositAmount, 16));
        });
    });

    winners.forEach(winner => {
        winTokenMap.set(winner.ownerAddress, (winTokenMap.get(winner.ownerAddress) || 0) + 1);
        refundMap.set(winner.ownerAddress, refundMap.get(winner.ownerAddress)! - parseInt(winner.depositAmount));
    });

    const results: any = {};
    Array.from(refundMap.keys()).forEach(user => {
        results[user] = {
            inWhitelist: whitelist.includes(user),
            depositAmount: depositMap.get(user)?.toString(),
            refundAmount: refundMap.get(user)?.toString() || '0',
            airdropAmount: winTokenMap.get(user) || 0,
        };
    });
    return results;
};

main().catch(console.error);
