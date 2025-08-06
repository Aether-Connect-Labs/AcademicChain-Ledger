pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EnterpriseBadges is ERC1155, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    mapping(uint256 => string) private _badgeMetadata;
    mapping(address => mapping(uint256 => bool)) private _verifications;

    event BadgeCreated(uint256 id, string metadataURI);
    event EmployeeVerified(address indexed enterprise, address indexed employee, uint256 badgeId);

    constructor() ERC1155("") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createBadge(uint256 id, string memory metadataURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _badgeMetadata[id] = metadataURI;
        emit BadgeCreated(id, metadataURI);
    }

    function verifyEmployee(address employee, uint256 badgeId) external onlyRole(VERIFIER_ROLE) {
        _verifications[employee][badgeId] = true;
        _mint(employee, badgeId, 1, "");
        emit EmployeeVerified(msg.sender, employee, badgeId);
    }

    function hasBadge(address account, uint256 badgeId) external view returns (bool) {
        return balanceOf(account, badgeId) > 0 || _verifications[account][badgeId];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _badgeMetadata[id];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}