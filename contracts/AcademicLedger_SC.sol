// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicLedger_SC {
    address public owner;
    mapping(address => bool) public institutions;
    mapping(bytes32 => bool) private isHashUsed;

    event InstitutionAdded(address indexed institution);
    event InstitutionRemoved(address indexed institution);
    event CredentialMintRequested(address indexed institution, address indexed student, bytes32 uniqueHash, string ipfsURI);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyInstitution() {
        require(institutions[msg.sender], "Not authorized institution");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addInstitution(address _institutionAddress) external onlyOwner {
        require(_institutionAddress != address(0), "Invalid address");
        institutions[_institutionAddress] = true;
        emit InstitutionAdded(_institutionAddress);
    }

    function removeInstitution(address _institutionAddress) external onlyOwner {
        institutions[_institutionAddress] = false;
        emit InstitutionRemoved(_institutionAddress);
    }

    function mintCredential(address student, bytes32 uniqueHash, string memory ipfsURI) external onlyInstitution {
        require(student != address(0), "Invalid student");
        require(uniqueHash != bytes32(0), "Invalid hash");
        require(bytes(ipfsURI).length > 0, "Invalid ipfsURI");
        require(!isHashUsed[uniqueHash], "Duplicate credential");
        isHashUsed[uniqueHash] = true;
        emit CredentialMintRequested(msg.sender, student, uniqueHash, ipfsURI);
        // HTS mint is executed off-chain by the server using the emitted data.
    }

    function isCredentialHashUsed(bytes32 uniqueHash) external view returns (bool) {
        return isHashUsed[uniqueHash];
    }
}