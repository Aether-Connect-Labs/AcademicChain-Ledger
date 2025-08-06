// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract HasgradToken is ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    mapping(address => uint256) private _lockedBalances;
    mapping(address => uint256) private _lockExpiry;
    uint256 private _totalLocked;
    
    event TokensLocked(address indexed account, uint256 amount, uint256 expiry);
    event TokensUnlocked(address indexed account, uint256 amount);
    event StakingRewardDistributed(address indexed account, uint256 amount);

    constructor() ERC20("HASGRAD Token", "HASGRADT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        
        // Mint inicial (10 millones)
        _mint(msg.sender, 10_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function lockTokens(address account, uint256 amount, uint256 lockDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(account) >= amount, "Insufficient balance");
        require(lockDuration > 0, "Invalid lock duration");
        
        _transfer(account, address(this), amount);
        _lockedBalances[account] += amount;
        _lockExpiry[account] = block.timestamp + lockDuration;
        _totalLocked += amount;
        
        emit TokensLocked(account, amount, block.timestamp + lockDuration);
    }

    function unlockTokens(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_lockedBalances[account] > 0, "No locked tokens");
        require(block.timestamp >= _lockExpiry[account], "Lock period not ended");
        
        uint256 amount = _lockedBalances[account];
        _lockedBalances[account] = 0;
        _lockExpiry[account] = 0;
        _totalLocked -= amount;
        
        _transfer(address(this), account, amount);
        emit TokensUnlocked(account, amount);
    }

    function distributeStakingReward(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(account, amount);
        emit StakingRewardDistributed(account, amount);
    }

    function lockedBalanceOf(address account) public view returns (uint256) {
        return _lockedBalances[account];
    }

    function lockedBalanceExpiry(address account) public view returns (uint256) {
        return _lockExpiry[account];
    }

    function totalLocked() public view returns (uint256) {
        return _totalLocked;
    }

    function availableBalanceOf(address account) public view returns (uint256) {
        return balanceOf(account) - _lockedBalances[account];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        if (from != address(0) && from != address(this)) {
            require(
                availableBalanceOf(from) >= amount,
                "Transfer amount exceeds available balance"
            );
        }
        super._beforeTokenTransfer(from, to, amount);
    }
}
