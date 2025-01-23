### Lottery Rules for xNomad AI NFT

The lottery rules are divided into two main parts:

---

### **1. User Eligibility Screening**
- Based on the whitelist, users are categorized into:
  - **"Whitelist Users"**
  - **"Public Users"**

---

### **2. Lottery Allocation**
- **Priority Handling**:
  1. **First Priority**: Whitelisted users are processed first.
  2. **Second Priority**: Users with higher deposit amounts are prioritized.

- **User Grouping**:
  - Users are grouped according to their deposit amounts.
  - Within the same group, `ticketId` is sorted in chronological order of deposit time.

- **Overflow Handling**:
  - If the number of deposit users exceeds the total supply, the winners are determined through random selection.

---

### **Lottery Record for Each User Group**:

1. **Direct Allocation**:  
   - If the number of users in the current group is less than or equal to the remaining supply, all users in the group are directly designated as winners.

2. **Random Selection**:  
   - If the number of users in the current group exceeds the remaining supply, winners are randomly selected based on a random seed (`randomSeed`) until the remaining supply is exhausted.  
   - The process includes:  
     - Using the **keccak256** hash function to iteratively generate random numbers and update the random seed.  
     - The generated random numbers correspond to the `ticketId` of winners.  
     - Random numbers are deduplicated to ensure each `ticketId` is selected only once. 

---

### **Random Seed Initialization**
- The initial random seed is set to **"xnomad"**. 