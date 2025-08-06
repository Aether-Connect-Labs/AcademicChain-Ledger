// contracts/EnhancedReferral.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AcademicReferralEngine is ReentrancyGuard {
    struct RewardTier {
        uint256 directReward;
        uint256 secondaryReward;
        uint256 vestingPeriod;
    }
    
    struct UserRewards {
        uint256 amount;
        uint256 vestingComplete;
    }
    
    mapping(uint => RewardTier) public rewardTiers;
    mapping(address => mapping(uint => UserRewards)) public userRewards;
    mapping(bytes32 => address) public referralCodes;
    mapping(address => uint256) public userReputation;
    
    uint256 public totalTiers;
    IERC20 public hasgradToken;
    address public treasury;
    
    // Configuración dinámica de recompensas
    uint256 public dynamicRewardBase = 100 * 10**18;
    uint256 public rewardDecayRate = 5; // 5% menos por nivel
    
    // Eventos mejorados
    event ReferralTreeBuilt(address indexed root, uint256 depth);
    event SmartRewardCalculated(address indexed user, uint256 complexityFactor);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ReferralCodeGenerated(bytes32 indexed code, address indexed user);

    constructor(address _token) {
        hasgradToken = IERC20(_token);
        treasury = msg.sender;
        
        // Configuración inicial de niveles
        rewardTiers[1] = RewardTier(100 * 10**18, 50 * 10**18, 30 days);
        rewardTiers[2] = RewardTier(80 * 10**18, 40 * 10**18, 60 days);
        totalTiers = 2;
    }

    function calculateDynamicReward(uint256 level, uint256 networkScore) public view returns (uint256) {
        uint256 base = dynamicRewardBase * (100 - rewardDecayRate)**(level-1) / 100**(level-1);
        return base * (100 + networkScore) / 100;
    }

    // Sistema de vesting con liberación gradual
    function claimVestedRewards(address user) external nonReentrant returns (uint256) {
        uint256 total;
        for (uint i = 1; i <= totalTiers; i++) {
            if (userRewards[user][i].vestingComplete < block.timestamp) {
                total += userRewards[user][i].amount;
                delete userRewards[user][i];
            }
        }
        require(total > 0, "No vested rewards");
        hasgradToken.transfer(user, total);
        emit RewardsClaimed(user, total);
        return total;
    }

    // Algoritmo de crecimiento orgánico
    function buildReferralTree(address root, uint256 depth) external {
        require(depth <= 5, "Excessive depth");
        _buildTree(root, depth, 0);
        emit ReferralTreeBuilt(root, depth);
    }
    
    function _buildTree(address node, uint256 depth, uint256 current) internal {
        if (current >= depth) return;
        
        // Lógica de construcción de árbol con generación de enlaces únicos
        bytes32 referralCode = keccak256(abi.encodePacked(node, current));
        referralCodes[referralCode] = node;
        emit ReferralCodeGenerated(referralCode, node);
        
        // Recursión controlada
        for (uint i = 0; i < 3; i++) { // Ramificación limitada
            address virtualNode = address(uint160(uint256(keccak256(abi.encodePacked(node, i)))));
            _buildTree(virtualNode, depth, current + 1);
        }
    }

    function setRewardTier(
        uint256 tier,
        uint256 directReward,
        uint256 secondaryReward,
        uint256 vestingPeriod
    ) external {
        require(msg.sender == treasury, "Only treasury");
        rewardTiers[tier] = RewardTier(directReward, secondaryReward, vestingPeriod);
        if (tier > totalTiers) totalTiers = tier;
    }

    function updateDecayRate(uint256 newRate) external {
        require(msg.sender == treasury, "Only treasury");
        require(newRate <= 20, "Rate too high");
        rewardDecayRate = newRate;
    }
}
