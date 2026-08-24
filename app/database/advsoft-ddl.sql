-- ========================================================
-- AdvSoft Database Schema (DDL)
-- Generated: 2026-08-24 04:26:24
-- Engine: MySQL / MariaDB (InnoDB, UTF-8 MB4)
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `account_account`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_account`;
CREATE TABLE `account_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` int DEFAULT NULL,
  `reconcile` int NOT NULL DEFAULT '0',
  `deprecated` int NOT NULL DEFAULT '0',
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `group_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` longtext COLLATE utf8mb4_unicode_ci,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_full_reconcile`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_full_reconcile`;
CREATE TABLE `account_full_reconcile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exchange_move_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_journal`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_journal`;
CREATE TABLE `account_journal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_account_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `restrict_mode_hash_table` int NOT NULL DEFAULT '0',
  `bank_account_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '10',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_move`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_move`;
CREATE TABLE `account_move` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/',
  `move_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'entry',
  `journal_id` int NOT NULL,
  `partner_id` int DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `date` date NOT NULL,
  `invoice_date_due` date DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `ref` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_untaxed` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amount_tax` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amount_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amount_residual` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_paid',
  `currency_id` int DEFAULT NULL,
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `company_id` int DEFAULT NULL,
  `sequence_prefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence_number` int DEFAULT NULL,
  `posted_before` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_move_line`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_move_line`;
CREATE TABLE `account_move_line` (
  `id` int NOT NULL AUTO_INCREMENT,
  `move_id` int NOT NULL,
  `account_id` int DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `tax_line_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amount_currency` decimal(14,2) NOT NULL DEFAULT '0.00',
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `quantity` decimal(14,2) NOT NULL DEFAULT '1.00',
  `price_unit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `price_subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `price_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reconciled` int NOT NULL DEFAULT '0',
  `full_reconcile_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `date_maturity` date DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '10',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_payment`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_payment`;
CREATE TABLE `account_payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `move_id` int DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `payment_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `journal_id` int DEFAULT NULL,
  `destination_account_id` int DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_reconciled` int NOT NULL DEFAULT '0',
  `is_matched` int NOT NULL DEFAULT '0',
  `company_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `account_tax`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `account_tax`;
CREATE TABLE `account_tax` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percent',
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tax_group_id` int DEFAULT NULL,
  `price_include` int NOT NULL DEFAULT '0',
  `include_base_amount` int NOT NULL DEFAULT '0',
  `type_tax_use` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sale',
  `account_id` int DEFAULT NULL,
  `refund_account_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '1',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `actions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `actions`;
CREATE TABLE `actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ir.actions.act_window',
  `res_model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `view_mode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'list,form',
  `domain` longtext COLLATE utf8mb4_unicode_ci,
  `context` longtext COLLATE utf8mb4_unicode_ci,
  `target` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'current',
  `limit` int NOT NULL DEFAULT '80',
  `help` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `activity_showcase`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `activity_showcase`;
CREATE TABLE `activity_showcase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showcase_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `cache`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `cache_locks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `custom_page_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `custom_page_items`;
CREATE TABLE `custom_page_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `failed_jobs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_act_report_xml`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_act_report_xml`;
CREATE TABLE `ir_act_report_xml` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'qweb-pdf',
  `report_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `print_report_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_config_parameter`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_config_parameter`;
CREATE TABLE `ir_config_parameter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_model`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_model`;
CREATE TABLE `ir_model` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `transient` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_model_access`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_model_access`;
CREATE TABLE `ir_model_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `perm_read` int NOT NULL DEFAULT '0',
  `perm_write` int NOT NULL DEFAULT '0',
  `perm_create` int NOT NULL DEFAULT '0',
  `perm_unlink` int NOT NULL DEFAULT '0',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_module_module`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_module_module`;
CREATE TABLE `ir_module_module` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uninstalled',
  `depends` longtext COLLATE utf8mb4_unicode_ci,
  `data_files` longtext COLLATE utf8mb4_unicode_ci,
  `auto_install` int NOT NULL DEFAULT '0',
  `installed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_rule`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_rule`;
CREATE TABLE `ir_rule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` int NOT NULL,
  `domain_force` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `global` int NOT NULL DEFAULT '0',
  `perm_read` int NOT NULL DEFAULT '1',
  `perm_write` int NOT NULL DEFAULT '0',
  `perm_create` int NOT NULL DEFAULT '0',
  `perm_unlink` int NOT NULL DEFAULT '0',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_rule_groups_rel`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_rule_groups_rel`;
CREATE TABLE `ir_rule_groups_rel` (
  `rule_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`rule_id`,`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_sequence`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_sequence`;
CREATE TABLE `ir_sequence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suffix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `padding` int NOT NULL DEFAULT '4',
  `number_next` int NOT NULL DEFAULT '1',
  `number_increment` int NOT NULL DEFAULT '1',
  `company_id` int DEFAULT NULL,
  `use_date_range` int NOT NULL DEFAULT '0',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_sequence_date_range`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_sequence_date_range`;
CREATE TABLE `ir_sequence_date_range` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sequence_id` int NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `number_next` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `ir_ui_views`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ir_ui_views`;
CREATE TABLE `ir_ui_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `arch` longtext COLLATE utf8mb4_unicode_ci,
  `priority` int NOT NULL DEFAULT '16',
  `active` int NOT NULL DEFAULT '1',
  `inherit_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inherit_group` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `job_batches`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` longtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `jobs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` int NOT NULL,
  `reserved_at` int DEFAULT NULL,
  `available_at` int NOT NULL,
  `created_at` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `menus`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int DEFAULT NULL,
  `action_id` int DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '10',
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `web_icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `web_icon_color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int NOT NULL DEFAULT '1',
  `groups` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `group_ids` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `security_view` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `view_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `password_reset_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `projects`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `date_start` date DEFAULT NULL,
  `date_end` date DEFAULT NULL,
  `budget` decimal(14,2) NOT NULL DEFAULT '0.00',
  `actual_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `task_count` int NOT NULL DEFAULT '0',
  `progress` decimal(14,2) NOT NULL DEFAULT '0.00',
  `allow_timesheets` int NOT NULL DEFAULT '1',
  `privacy_visibility` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'portal',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_company`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_company`;
CREATE TABLE `res_company` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` longtext COLLATE utf8mb4_unicode_ci,
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_groups`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_groups`;
CREATE TABLE `res_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `share` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_groups_category`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_groups_category`;
CREATE TABLE `res_groups_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '10',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_groups_implied_rel`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_groups_implied_rel`;
CREATE TABLE `res_groups_implied_rel` (
  `group_id` int NOT NULL,
  `implied_id` int NOT NULL,
  PRIMARY KEY (`group_id`,`implied_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_partner`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_partner`;
CREATE TABLE `res_partner` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int NOT NULL DEFAULT '1',
  `is_company` int NOT NULL DEFAULT '0',
  `company_id` int DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contact',
  `parent_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `property_account_receivable_id` int DEFAULT NULL,
  `property_account_payable_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_users`;
CREATE TABLE `res_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `active` int NOT NULL DEFAULT '1',
  `share` int NOT NULL DEFAULT '0',
  `signature` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `res_users_groups_rel`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `res_users_groups_rel`;
CREATE TABLE `res_users_groups_rel` (
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `saved_filters`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `saved_filters`;
CREATE TABLE `saved_filters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` longtext COLLATE utf8mb4_unicode_ci,
  `group_by` longtext COLLATE utf8mb4_unicode_ci,
  `order_by` longtext COLLATE utf8mb4_unicode_ci,
  `is_default` int NOT NULL DEFAULT '0',
  `is_shared` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `showcase_m2m_all`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `showcase_m2m_all`;
CREATE TABLE `showcase_m2m_all` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showcase_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `showcase_m2m_bin`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `showcase_m2m_bin`;
CREATE TABLE `showcase_m2m_bin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showcase_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `showcase_m2m_check`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `showcase_m2m_check`;
CREATE TABLE `showcase_m2m_check` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showcase_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `showcase_tag`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `showcase_tag`;
CREATE TABLE `showcase_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showcase_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `showcases`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `showcases`;
CREATE TABLE `showcases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `html_content` longtext COLLATE utf8mb4_unicode_ci,
  `age` int DEFAULT NULL,
  `score` decimal(14,2) DEFAULT NULL,
  `price` decimal(14,2) DEFAULT NULL,
  `progress` int DEFAULT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  `is_favorite` int NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `priority` int NOT NULL DEFAULT '0',
  `user_id` int DEFAULT NULL,
  `image_data` longtext COLLATE utf8mb4_unicode_ci,
  `document_data` longtext COLLATE utf8mb4_unicode_ci,
  `signature_data` longtext COLLATE utf8mb4_unicode_ci,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain_data` longtext COLLATE utf8mb4_unicode_ci,
  `code_snippet` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `ref_model` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_idx` int DEFAULT NULL,
  `json_data` longtext COLLATE utf8mb4_unicode_ci,
  `countdown_time` datetime DEFAULT NULL,
  `note_section` longtext COLLATE utf8mb4_unicode_ci,
  `stat_value` int DEFAULT '42',
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'EUR',
  `monetary_full` decimal(14,2) DEFAULT NULL,
  `barcode_user` int DEFAULT NULL,
  `sel_badge` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '1',
  `factor_float` double DEFAULT NULL,
  `toggle_float` double DEFAULT '0.5',
  `int_badge` int DEFAULT '5',
  `lbl_sel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'b',
  `clipboard_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emoji_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percent_val` decimal(14,2) DEFAULT NULL,
  `time_val` decimal(14,2) DEFAULT NULL,
  `handle_val` int NOT NULL DEFAULT '0',
  `bool_btn` int NOT NULL DEFAULT '0',
  `date_range` date DEFAULT NULL,
  `radio_sel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge_sel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datetime_val` datetime DEFAULT NULL,
  `binary_val` longtext COLLATE utf8mb4_unicode_ci,
  `manager_id` int DEFAULT NULL,
  `char_badge_demo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_checked` int NOT NULL DEFAULT '0',
  `pct_pie` int NOT NULL DEFAULT '0',
  `state_selection_demo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_binary_demo` longtext COLLATE utf8mb4_unicode_ci,
  `date_date` date DEFAULT NULL,
  `handle_sort` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `spreadsheet_collaboration`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `spreadsheet_collaboration`;
CREATE TABLE `spreadsheet_collaboration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spreadsheet_id` int NOT NULL,
  `user_id` int NOT NULL,
  `cursor_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `cursor_col` int DEFAULT NULL,
  `cursor_row` int DEFAULT NULL,
  `selection` longtext COLLATE utf8mb4_unicode_ci,
  `last_active_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `spreadsheet_data`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `spreadsheet_data`;
CREATE TABLE `spreadsheet_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `spreadsheet_data` longtext COLLATE utf8mb4_unicode_ci,
  `raw_data` longtext COLLATE utf8mb4_unicode_ci,
  `user_id` int DEFAULT NULL,
  `parent_model` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `is_template` int NOT NULL DEFAULT '0',
  `is_favorite` int NOT NULL DEFAULT '0',
  `thumbnail` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `spreadsheet_operations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `spreadsheet_operations`;
CREATE TABLE `spreadsheet_operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spreadsheet_id` int NOT NULL,
  `user_id` int NOT NULL,
  `operation_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `sequence` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `stages`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stages`;
CREATE TABLE `stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sequence` int NOT NULL DEFAULT '10',
  `fold` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `tags`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `task_tag`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `task_tag`;
CREATE TABLE `task_tag` (
  `task_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`task_id`,`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `task_timesheets`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `task_timesheets`;
CREATE TABLE `task_timesheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `tasks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `project_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `assignee` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `deadline` date DEFAULT NULL,
  `planned_hours` decimal(14,2) NOT NULL DEFAULT '0.00',
  `progress` decimal(14,2) NOT NULL DEFAULT '0.00',
  `active` int NOT NULL DEFAULT '1',
  `is_favorite` tinyint(1) NOT NULL DEFAULT '0',
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
