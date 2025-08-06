// contracts/ReferralProgram.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReferralProgram is Ownable {
    struct Referral {
        address referrer;
        uint256 timestamp;
        bool rewarded;
    }
    
    IERC20 public rewardToken;
    uint256 public rewardAmount = 100 * 10**18; // 100 tokens
    uint256 public secondaryReward = 50 * 10**18; // 50 tokens
    
    mapping(address => Referral) public referrals;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public rewardsEarned;
    
    event ReferralRegistered(address indexed user, address indexed referrer);
    event RewardPaid(address indexed referrer, uint256 amount, uint256 level);
    
    constructor(address _token) {
        rewardToken = IERC20(_token);
    }
    
    function register(address referrer) external {
        require(referrer != address(0), "Invalid referrer");
        require(referrals[msg.sender].referrer == address(0), "Already registered");
        require(msg.sender != referrer, "Cannot refer yourself");
        
        referrals[msg.sender] = Referral({
            referrer: referrer,
            timestamp: block.timestamp,
            rewarded: false
        });
        
        emit ReferralRegistered(msg.sender, referrer);
    }
    
    function claimRewards() external {
        uint256 totalReward = 0;
        
        // Recompensa directa (nivel 1)
        address[] memory directReferrals = getDirectReferrals(msg.sender);
        for (uint256 i = 0; i < directReferrals.length; i++) {
            if (!referrals[directReferrals[i]].rewarded) {
                totalReward += rewardAmount;
                referrals[directReferrals[i]].rewarded = true;
                emit RewardPaid(msg.sender, rewardAmount, 1);
            }
        }
        
        // Recompensa secundaria (nivel 2)
        address[] memory secondaryReferrals = getSecondaryReferrals(msg.sender);
        for (uint256 i = 0; i < secondaryReferrals.length; i++) {
            if (!referrals[secondaryReferrals[i]].rewarded) {
                totalReward += secondaryReward;
                referrals[secondaryReferrals[i]].rewarded = true;
                emit RewardPaid(msg.sender, secondaryReward, 2);
            }
        }
        
        require(totalReward > 0, "No rewards to claim");
        require(rewardToken.transfer(msg.sender, totalReward), "Transfer failed");
        
        rewardsEarned[msg.sender] += totalReward;
    }
    
    function getDirectReferrals(address referrer) public view returns (address[] memory) {
        // Placeholder implementation - should be implemented with proper tracking
        address[] memory referralsList = new address[](0);
        return referralsList;
    }
    
    function getSecondaryReferrals(address referrer) public view returns (address[] memory) {
        // Placeholder implementation - should be implemented with proper tracking
        address[] memory referralsList = new address[](0);
        return referralsList;
    }
    
    function setRewardAmounts(uint256 primary, uint256 secondary) external onlyOwner {
        rewardAmount = primary;
        secondaryReward = secondary;
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner {
        rewardToken.transfer(owner(), amount);
    }
}
