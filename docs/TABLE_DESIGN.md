# Table Design

### 1. User Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique User ID |
| 2 | `fullName` | String | Full Name of the User |
| 3 | `email` | String | Email Address (Unique Login Identifier) |
| 4 | `password` | String | Encrypted Password (bcrypt hash) |
| 5 | `phone` | String | Contact Phone Number |
| 6 | `role` | String | User Role (`donor` / `recipient_org` / `volunteer` / `admin`) |
| 7 | `isVerified` | Boolean | Account Verification State |
| 8 | `avatar` | String | Profile Image URL / Path |
| 9 | `resetPasswordToken` | String | Security Token for Password Reset |
| 10 | `resetPasswordExpires` | Date | Expiration Date of Reset Token |
| 11 | `createdAt` | Date | Registration Date |
| 12 | `updatedAt` | Date | Last Update Date |

---

### 2. Donor Profile Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Donor Profile ID |
| 2 | `userId` | ObjectId | Reference to User (`users._id`) |
| 3 | `donorType` | String | Classification (`individual` / `small_business` / `educational_institution`) |
| 4 | `preferredCategories` | Array | Preferred donation item types (`food`, `clothes`, `medicine`, etc.) |
| 5 | `address` | String | Physical Street Address |
| 6 | `latitude` | Number | Geolocation Latitude |
| 7 | `longitude` | Number | Geolocation Longitude |
| 8 | `totalDonations` | Number | Count of Completed Contributions |
| 9 | `createdAt` | Date | Profile Creation Date |
| 10 | `updatedAt` | Date | Last Update Date |

---

### 3. Recipient Organization Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Organization ID |
| 2 | `userId` | ObjectId | Reference to User (`users._id`) |
| 3 | `orgName` | String | Registered Organization Name |
| 4 | `orgType` | String | Organization Type (`ngo` / `orphanage` / `old_age_home` / `government_school`) |
| 5 | `registrationNumber` | String | Official Government Registration Number |
| 6 | `address` | String | Physical Operating Address |
| 7 | `verificationDocs` | Array | Document File Paths for Verification |
| 8 | `latitude` | Number | Geolocation Latitude |
| 9 | `longitude` | Number | Geolocation Longitude |
| 10 | `verificationStatus` | String | Verification Status (`pending` / `verified` / `rejected`) |
| 11 | `approvedBy` | ObjectId | Reference to Admin (`users._id`) |
| 12 | `approvedAt` | Date | Verification Timestamp |
| 13 | `rejectionReason` | String | Reason for Rejection (if applicable) |
| 14 | `createdAt` | Date | Registration Date |
| 15 | `updatedAt` | Date | Last Update Date |

---

### 4. Volunteer Profile Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Volunteer ID |
| 2 | `userId` | ObjectId | Reference to User (`users._id`) |
| 3 | `dob` | Date | Date of Birth |
| 4 | `phone` | String | Contact Number |
| 5 | `address` | String | Residential Address |
| 6 | `skills` | Array | Volunteer Skills (`Driving`, `Logistics & Delivery`, `First Aid`, etc.) |
| 7 | `latitude` | Number | Base Geolocation Latitude |
| 8 | `longitude` | Number | Base Geolocation Longitude |
| 9 | `completedDeliveries` | Number | Count of Completed Deliveries |
| 10 | `idDocument` | String | Government ID Document Path |
| 11 | `verificationStatus` | String | Approval Status (`pending` / `verified` / `rejected`) |
| 12 | `approvedBy` | ObjectId | Reference to Admin (`users._id`) |
| 13 | `approvedAt` | Date | Verification Timestamp |
| 14 | `rejectionReason` | String | Reason for Rejection |
| 15 | `createdAt` | Date | Registration Date |
| 16 | `updatedAt` | Date | Last Update Date |

---

### 5. Resource Donation Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Donation ID |
| 2 | `donorId` | ObjectId | Reference to Donor (`donors._id`) |
| 3 | `postedBy` | ObjectId | Reference to User (`users._id`) |
| 4 | `category` | String | Resource Category (`food` / `clothes` / `books` / `medicine` / `essentials`) |
| 5 | `donationName` | String | Name/Title of Donated Resource |
| 6 | `quantity` | Number | Quantity Available |
| 7 | `unit` | String | Unit of Measurement (e.g., Packets, Kg, Boxes) |
| 8 | `description` | String | Detailed Item Description |
| 9 | `pickupAddress` | String | Pickup Location Address |
| 10 | `latitude` | Number | Pickup Geolocation Latitude |
| 11 | `longitude` | Number | Pickup Geolocation Longitude |
| 12 | `image` | String | Donated Resource Image Path |
| 13 | `contactNumber` | String | Donor Contact Number for Pickup |
| 14 | `notes` | String | Special Pickup Notes |
| 15 | `status` | String | Lifecycle Status (`pending` / `matched` / `accepted` / `assigned` / `delivered`) |
| 16 | `matchedRequirement` | ObjectId | Reference to Requirement (`requirements._id`) |
| 17 | `matchedOrganization` | ObjectId | Reference to Recipient Org (`recipientorganizations._id`) |
| 18 | `matchScore` | Number | AI Recommendation Score (0–100) |
| 19 | `acceptedAt` | Date | Acceptance Timestamp |
| 20 | `deliveredAt` | Date | Delivery Completion Timestamp |
| 21 | `createdAt` | Date | Posting Date |
| 22 | `updatedAt` | Date | Last Update Date |

---

### 6. Resource Requirement Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Requirement ID |
| 2 | `organizationId` | ObjectId | Reference to Recipient Org (`recipientorganizations._id`) |
| 3 | `postedBy` | ObjectId | Reference to User (`users._id`) |
| 4 | `category` | String | Category Needed (`food` / `clothes` / `books` / `medicine` / `essentials`) |
| 5 | `title` | String | Requirement Title |
| 6 | `description` | String | Detailed Description of Need |
| 7 | `quantity` | Number | Quantity Required |
| 8 | `unit` | String | Measurement Unit |
| 9 | `urgency` | String | Urgency Level (`low` / `medium` / `high` / `critical`) |
| 10 | `location` | String | Delivery Address |
| 11 | `latitude` | Number | Geolocation Latitude |
| 12 | `longitude` | Number | Geolocation Longitude |
| 13 | `beneficiaryType` | String | Target Beneficiaries (e.g., Orphanage Children) |
| 14 | `beneficiaryCount` | Number | Number of Beneficiaries |
| 15 | `requiredBefore` | Date | Required Expiration Date |
| 16 | `imageUrl` | String | Requirement Reference Image Path |
| 17 | `status` | String | Requirement State (`pending` / `open` / `matched` / `fulfilled` / `closed`) |
| 18 | `matchedDonation` | ObjectId | Reference to Matched Donation (`donations._id`) |
| 19 | `expiresAt` | Date | Expiration Date |
| 20 | `createdAt` | Date | Creation Date |
| 21 | `updatedAt` | Date | Last Update Date |

---

### 7. Delivery & Logistics Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Delivery Task ID |
| 2 | `donationId` | ObjectId | Reference to Donation (`donations._id`) |
| 3 | `volunteerId` | ObjectId | Reference to Volunteer (`volunteers._id`) |
| 4 | `assignedBy` | ObjectId | Reference to Assigning User (`users._id`) |
| 5 | `pickupAddress` | String | Pickup Address |
| 6 | `dropAddress` | String | Drop-off Address |
| 7 | `pickupLat` | Number | Pickup Latitude |
| 8 | `pickupLng` | Number | Pickup Longitude |
| 9 | `dropLat` | Number | Drop-off Latitude |
| 10 | `dropLng` | Number | Drop-off Longitude |
| 11 | `scheduledTime` | Date | Scheduled Delivery Timestamp |
| 12 | `status` | String | Delivery Status (`assigned` / `picked_up` / `in_transit` / `delivered` / `failed`) |
| 13 | `proofImages` | Array | Proof of Delivery Image Paths |
| 14 | `proofNote` | String | Delivery Confirmation Note |
| 15 | `pickedUpAt` | Date | Actual Pickup Timestamp |
| 16 | `deliveredAt` | Date | Actual Delivery Timestamp |
| 17 | `createdAt` | Date | Task Creation Date |
| 18 | `updatedAt` | Date | Last Update Date |

---

### 8. Notification Collection
| Sl. No. | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `_id` | ObjectId | Unique Notification ID |
| 2 | `userId` | ObjectId | Target User Reference (`users._id`) |
| 3 | `title` | String | Notification Title |
| 4 | `message` | String | Notification Message Text |
| 5 | `type` | String | Type (`donation` / `requirement` / `delivery` / `system` / `match`) |
| 6 | `isRead` | Boolean | Read / Unread Status Flag |
| 7 | `relatedId` | ObjectId | Associated Entity ID |
| 8 | `relatedModel` | String | Associated Entity Model (`Donation` / `Requirement` / `Delivery`) |
| 9 | `createdAt` | Date | Notification Date |
| 10 | `updatedAt` | Date | Last Update Date |
